"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit, Eye, Search, ArrowLeft, Upload, X, Download, Trash2 } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  stock: number
  image: string
  status: "active" | "inactive"
}

interface ProductsPageProps {
  userData: {
    username: string
    role: "admin" | "user"
    name: string
    id: string // Added id to userData
  }
  category: {
    id: string
    name: string
  }
  onNavigateBack: () => void
}

export default function ProductsPage({ userData, category, onNavigateBack }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [editImagePreview, setEditImagePreview] = useState<string>("")
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    price: 0,
    category: category?.name || "",
    stock: 0,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  })

  const { toast } = useToast();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);

  // ดึงข้อมูลจาก Supabase
    const fetchProducts = async () => {
      if (!category?.id) return;
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, stock, image_url, status, categories(name)")
        .eq("category_id", category.id)
      if (!error && data) {
        setProducts(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.categories?.name || category?.name || "",
            stock: p.stock,
            image: p.image_url,
            status: p.status,
          }))
        )
      }
    }

  useEffect(() => {
    if (!category?.id || typeof category.id !== 'string' || category.id.length <= 10) return;
    fetchProducts();
  }, [category?.id, category?.name])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์ต้องไม่เกิน 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (isEdit && editingProduct) {
          setEditImagePreview(result)
          setEditingProduct({ ...editingProduct, image: result })
        } else {
          setImagePreview(result)
          setNewProduct({ ...newProduct, image: result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (isEdit = false) => {
    if (isEdit && editingProduct) {
      setEditImagePreview("")
      setEditingProduct({ ...editingProduct, image: "/placeholder.svg?height=100&width=100" })
    } else {
      setImagePreview("")
      setNewProduct({ ...newProduct, image: "/placeholder.svg?height=100&width=100" })
    }
  }

  const handleAddProduct = async () => {
    try {
      // ตรวจสอบชื่อสินค้าซ้ำในหมวดหมู่เดียวกัน
      const { data: existing, error: checkError } = await supabase
        .from("products")
        .select("id")
        .ilike("name", newProduct.name)
        .eq("category_id", category?.id)
        .maybeSingle();
      if (existing) {
        alert("มีชื่อสินค้านี้อยู่แล้วในหมวดหมู่นี้ กรุณาตั้งชื่อใหม่");
        return;
      }
      const { data: inserted, error } = await supabase
        .from("products")
        .insert([
          {
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            stock: newProduct.stock,
            image_url: newProduct.image,
            status: newProduct.status,
            category_id: category?.id,
          },
        ])
        .select();

      console.log("inserted:", inserted);
      console.log("insert error:", error);

      if (error) throw error;

      // === บันทึก log ===
      await supabase.from('logs').insert([
        {
          username: userData.username,
          action: 'เพิ่มสินค้า',
          target_type: 'product',
          target_name: newProduct.name,
          detail: JSON.stringify(newProduct),
        }
      ]);
      // fetch ข้อมูลใหม่หลัง insert
      await fetchProducts();

      setNewProduct({
        name: "",
        description: "",
        price: 0,
        category: category?.name || "",
        stock: 0,
        image: "/placeholder.svg?height=100&width=100",
        status: "active",
      });
      setImagePreview("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Add product error:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    }
  }

  const handleEditProduct = async () => {
    if (editingProduct) {
      try {
        const { error } = await supabase
          .from("products")
          .update({
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price,
            stock: editingProduct.stock,
            image_url: editingProduct.image,
            status: editingProduct.status,
          })
          .eq("id", editingProduct.id);
        if (error) throw error;
        // === บันทึก log ===
        await supabase.from('logs').insert([
          {
            username: userData.username,
            action: 'แก้ไขสินค้า',
            target_type: 'product',
            target_name: editingProduct.name,
            detail: JSON.stringify(editingProduct),
          }
        ]);
        await fetchProducts(); // ดึงข้อมูลใหม่หลัง update
        setEditingProduct(null);
        setEditImagePreview("");
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("Edit product error:", error);
        alert("เกิดข้อผิดพลาดในการแก้ไขสินค้า");
      }
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct({ ...product })
    setEditImagePreview(product.image)
    setIsEditDialogOpen(true)
  }

  const handleExportProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, stock, image_url, status, categories(name)")
        .eq("category_id", category?.id)

      if (error) throw error

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `รายการสินค้า_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล")
    }
  }

  // เพิ่มฟังก์ชันลบสินค้า
  const handleDeleteProduct = async (productId: number | string) => {
    if (!window.confirm("คุณต้องการลบสินค้านี้หรือไม่?")) return;
    try {
      // หา product ที่จะลบเพื่อบันทึก log
      const { data: productToDelete } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .maybeSingle();
      // ลบ orders ที่อ้างถึงสินค้านี้ก่อน
      console.log("จะลบ order ที่ product_id =", productId);
      const { data: ordersToDelete, error: orderQueryError } = await supabase
        .from("orders")
        .select("*")
        .eq("product_id", String(productId));
      console.log("orders ที่จะถูกลบ:", ordersToDelete, orderQueryError);

      await supabase.from("orders").delete().eq("product_id", String(productId));

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      // === บันทึก log ===
      await supabase.from('logs').insert([
        {
          username: userData.username,
          action: 'ลบสินค้า',
          target_type: 'product',
          target_name: productToDelete?.name || String(productId),
          detail: '',
        }
      ]);
      // รีเฟรชรายการสินค้า
      await fetchProducts();
    } catch (error: any) {
      console.error("Delete product error:", error);
      let msg = error?.message || JSON.stringify(error);
      alert("เกิดข้อผิดพลาดในการลบสินค้า: " + msg);
    }
  };

  // ฟังก์ชันเปิด dialog ซื้อ
  const openBuyDialog = (product: Product) => {
    setBuyingProduct(product);
    setBuyQuantity(1);
    setBuyDialogOpen(true);
  };

  // ฟังก์ชันซื้อสินค้า
  const handleBuyProduct = async () => {
    if (!buyingProduct) return;
    const quantity = buyQuantity;
    if (!userData || !userData.id) {
      alert('กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');
      return;
    }
    if (quantity < 1 || quantity > buyingProduct.stock) {
      alert('สินค้าไม่เพียงพอ');
      return;
    }
    const total_price = buyingProduct.price * quantity;
    // 1. insert order
    const { error } = await supabase.from('orders').insert([
      {
        user_id: userData.id,
        product_id: buyingProduct.id,
        quantity,
        total_price,
      }
    ]);
    if (!error) {
      // 2. update stock
      await supabase.from('products').update({ stock: buyingProduct.stock - quantity }).eq('id', buyingProduct.id);
      setBuyDialogOpen(false);
      toast({ title: 'สั่งซื้อสำเร็จ', description: `คุณได้ซื้อ ${buyingProduct.name} จำนวน ${quantity} ชิ้น`, });
      await fetchProducts(); // refresh
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onNavigateBack}
          className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-black">คลังสินค้า - {category?.name || ""}</h2>
          <p className="text-gray-600 mt-2">จัดการสินค้าในหมวดหมู่ {category?.name || ""}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="ค้นหาสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-black focus:ring-black"
          />
        </div>

        <div className="flex gap-2">
          {userData?.role === "admin" && (
            <>
              <Button
                variant="outline"
                onClick={handleExportProducts}
                className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                ส่งออก Excel
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มสินค้า
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-card border-gray-300 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-black">เพิ่มสินค้าใหม่</DialogTitle>
                  </DialogHeader>
                  <DialogDescription id="add-product-desc">
                    กรอกข้อมูลเพื่อเพิ่มสินค้าใหม่
                  </DialogDescription>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-black">
                        ชื่อสินค้า
                      </Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-black">
                        รายละเอียด
                      </Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="border-gray-300 focus:border-black focus:ring-black"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price" className="text-black">
                          ราคา
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stock" className="text-black">
                          จำนวนคงเหลือ
                        </Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="grid gap-2">
                      <Label htmlFor="image" className="text-black">
                        รูปภาพสินค้า
                      </Label>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                            {imagePreview ? (
                              <>
                                <Image
                                  src={imagePreview || "/placeholder.svg"}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(false)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-xs">อัพโหลดรูปภาพ</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, false)}
                              className="hidden"
                            />
                            <div className="px-4 py-2 bg-background text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                              เลือกรูปภาพ
                            </div>
                          </label>
                        </div>

                        <p className="text-xs text-gray-500 text-center">รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB</p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status" className="text-black">
                        สถานะ
                      </Label>
                      <Select
                        value={newProduct.status}
                        onValueChange={(value: "active" | "inactive") =>
                          setNewProduct({ ...newProduct, status: value })
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-gray-300">
                          <SelectItem value="active">เปิดใช้งาน</SelectItem>
                          <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        setImagePreview("")
                      }}
                      className="border-gray-300 text-black hover:bg-gray-50"
                    >
                      ยกเลิก
                    </Button>
                    <Button onClick={handleAddProduct} className="bg-black text-white hover:bg-gray-800">
                      เพิ่มสินค้า
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-gray-200 bg-card">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-black">รายการสินค้า ({filteredProducts.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-black font-semibold">รูปภาพ</TableHead>
                <TableHead className="text-black font-semibold">ชื่อสินค้า</TableHead>
                <TableHead className="text-black font-semibold">ราคา</TableHead>
                <TableHead className="text-black font-semibold">คงเหลือ</TableHead>
                <TableHead className="text-black font-semibold">สถานะ</TableHead>
                <TableHead className="text-black font-semibold">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell>
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-black">{product.name}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">{product.description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-black">฿{product.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${product.stock < 10 ? "text-red-600" : "text-black"}`}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={product.stock === 0 ? "border border-red-600 text-red-600 bg-transparent" : (product.status === "active" ? "bg-black text-white" : "bg-gray-200 text-gray-700")}
                    >
                      {product.stock === 0 ? "สินค้าหมดสต็อก" : product.status === "active" ? "มีสินค้า" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {userData?.role === "admin" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            className="border-gray-300 text-black hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="border-gray-300 text-red-600 hover:bg-red-50"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700 ml-2"
                            onClick={() => openBuyDialog(product)}
                            disabled={product.stock === 0}
                          >
                            ซื้อ
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {userData?.role === "admin" && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md bg-card border-gray-300 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black">แก้ไขสินค้า</DialogTitle>
            </DialogHeader>
            <DialogDescription id="edit-product-desc">
              แก้ไขข้อมูลสินค้าตามต้องการ
            </DialogDescription>
            {editingProduct && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name" className="text-black">
                    ชื่อสินค้า
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description" className="text-black">
                    รายละเอียด
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price" className="text-black">
                      ราคา
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock" className="text-black">
                      จำนวนคงเหลือ
                    </Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-image" className="text-black">
                    รูปภาพสินค้า
                  </Label>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        {editImagePreview && editImagePreview !== "/placeholder.svg?height=100&width=100" ? (
                          <>
                            <Image
                              src={editImagePreview || "/placeholder.svg"}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(true)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-xs">อัพโหลดรูปภาพ</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                          className="hidden"
                        />
                        <div className="px-4 py-2 bg-background text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                          เปลี่ยนรูปภาพ
                        </div>
                      </label>
                    </div>

                    <p className="text-xs text-gray-500 text-center">รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status" className="text-black">
                    สถานะ
                  </Label>
                  <Select
                    value={editingProduct.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setEditingProduct({ ...editingProduct, status: value })
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-300">
                      <SelectItem value="active">เปิดใช้งาน</SelectItem>
                      <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditImagePreview("")
                }}
                className="border-gray-300 text-black hover:bg-gray-50"
              >
                ยกเลิก
              </Button>
              <Button onClick={handleEditProduct} className="bg-black text-white hover:bg-gray-800">
                บันทึกการแก้ไข
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog ซื้อสินค้า */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="max-w-xs bg-card border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black">ซื้อสินค้า</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {buyingProduct && (
              <div className="space-y-4">
                <div className="font-medium text-black">{buyingProduct.name}</div>
                <div className="text-gray-600">ราคา: ฿{buyingProduct.price.toLocaleString()}</div>
                <div className="text-gray-600">คงเหลือ: {buyingProduct.stock}</div>
                {buyingProduct.stock === 0 ? (
                  <div className="text-red-600 font-semibold">สินค้าหมดสต็อก</div>
                ) : (
                  <>
                    <div>
                      <label className="text-black text-sm">จำนวนที่ต้องการซื้อ</label>
                      <Input
                        type="number"
                        min={1}
                        max={buyingProduct.stock}
                        value={buyQuantity}
                        onChange={e => setBuyQuantity(Number(e.target.value))}
                        className="mt-1"
                      />
                      {buyQuantity > buyingProduct.stock && (
                        <div className="text-red-600 text-sm mt-1">สินค้าไม่เพียงพอ</div>
                      )}
                    </div>
                    <Button
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      onClick={handleBuyProduct}
                      disabled={buyQuantity > buyingProduct.stock || buyQuantity < 1}
                    >
                      ยืนยันซื้อ
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, ArrowRight, Users, Download, LogOut } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from 'uuid';

interface Category {
  id: string
  name: string
  description: string
  productCount: number
  icon: string
}

interface CategoryPageProps {
  userData: {
    username: string
    role: "admin" | "user"
    name: string
  }
  onNavigateToProducts: (categoryId: string, categoryName: string) => void
  onNavigateToUsers: () => void
}

export default function CategoryPage({ userData, onNavigateToProducts, onNavigateToUsers }: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState<Omit<Category, "id" | "productCount">>({
    name: "",
    description: "",
    icon: "📦",
  })

  // เพิ่ม state สำหรับกราฟและยอดสินค้า
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([])
  const [totalProducts, setTotalProducts] = useState<number>(0)
  const [totalValue, setTotalValue] = useState<number>(0)
  const [loadingStats, setLoadingStats] = useState(true)

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false)

  const EMOJI_OPTIONS = [
    "📦", // กล่อง (default)
    "💻", // อิเล็กทรอนิกส์
    "👕", // เสื้อผ้า
    "🔧", // เครื่องมือ
    "🏗️", // ก่อสร้าง
    "🍔", // อาหาร
    "🎈", // หนังสือ
    "🎮", // เกม
    "🛒", // ช้อปปิ้ง
    "🚗", // รถยนต์
    "🏠", // บ้าน
    "🧸", // ของเล่น
    "💡", // ไอเดีย/นวัตกรรม
    "🎵", // ดนตรี
    "📱", // มือถือ
  ];

  // ฟังก์ชันช่วยเช็ค role อย่างปลอดภัย
  const isAdmin = userData && userData.role === "admin";

  // ดึง categories จาก Supabase
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, icon, products(count)");
    console.log("fetchCategories data:", data);
    if (!error && data) {
      setCategories(
        data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          productCount: c.products?.[0]?.count ?? 0,
          icon: c.icon,
        }))
      );
    }
    if (error) {
      console.error('Supabase fetch error:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    // เพิ่ม fetch สถิติ
    const fetchStats = async () => {
      setLoadingStats(true)
      const { data: revenueData } = await supabase.from('daily_revenue').select('*')
      const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true })
      const { data: valueData } = await supabase.from('products').select('price, stock')
      let sumValue = 0
      if (valueData) {
        sumValue = valueData.reduce((acc, cur) => acc + (cur.price || 0) * (cur.stock || 0), 0)
      }
      setDailyRevenue(revenueData || [])
      setTotalProducts(productCount || 0)
      setTotalValue(sumValue)
      setLoadingStats(false)
    }
    fetchStats()
  }, []);

  // ส่ง category object ที่มี id (UUID) จริงไปยัง ProductsPage
  const handleNavigateToProducts = (categoryId: string, categoryName: string) => {
    onNavigateToProducts(categoryId, categoryName)
  }

  const handleAddCategory = async () => {
    const customId = uuidv4(); // สร้าง UUID ใหม่
    const payload = {
      id: customId,
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon,
    };
    console.log('Insert category payload:', payload);
    const { error } = await supabase
      .from("categories")
      .insert([payload]);
    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
      console.error('Supabase insert error:', error);
    } else {
      // === บันทึก log ===
      await supabase.from('logs').insert([
        {
          username: userData.username,
          action: 'เพิ่มหมวดหมู่',
          target_type: 'category',
          target_name: newCategory.name,
          detail: JSON.stringify(payload),
        }
      ]);
      await fetchCategories(); // ดึงข้อมูลใหม่หลัง insert
      setIsAddDialogOpen(false);
    }
  };

  const handleEditCategory = async () => {
    if (editingCategory) {
      // update category ใน Supabase
      const { error } = await supabase
        .from("categories")
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
          icon: editingCategory.icon,
        })
        .eq("id", editingCategory.id);
      if (!error) {
        // === บันทึก log ===
        await supabase.from('logs').insert([
          {
            username: userData.username,
            action: 'แก้ไขหมวดหมู่',
            target_type: 'category',
            target_name: editingCategory.name,
            detail: JSON.stringify(editingCategory),
          }
        ]);
        await fetchCategories(); // ดึงข้อมูลใหม่หลัง update
        setEditingCategory(null);
        setIsEditDialogOpen(false);
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    // หา category ที่จะลบเพื่อบันทึก log
    const { data: categoryToDelete } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .maybeSingle();
    // เช็คว่ามีสินค้าในหมวดหมู่นี้หรือไม่
    const { count: productCount, error: countError } = await supabase
      .from("products")
      .select("id", { count: 'exact', head: true })
      .eq("category_id", categoryId);
    if (countError) {
      alert("เกิดข้อผิดพลาดในการตรวจสอบสินค้า: " + countError.message);
      return;
    }
    if (productCount && productCount > 0) {
      alert("ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีสินค้าอยู่ในหมวดหมู่นี้ กรุณาลบสินค้าทั้งหมดก่อน");
      return;
    }
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (!error) {
      // === บันทึก log ===
      await supabase.from('logs').insert([
        {
          username: userData.username,
          action: 'ลบหมวดหมู่',
          target_type: 'category',
          target_name: categoryToDelete?.name || String(categoryId),
          detail: '',
        }
      ]);
      await fetchCategories(); // ดึงข้อมูลใหม่จากฐานข้อมูล
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message);
      console.log(error);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory({ ...category })
    setIsEditDialogOpen(true)
  }

  const handleExportCategories = async () => {
    try {
      const response = await fetch("/api/export/categories")
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `รายการหมวดหมู่_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล")
    }
  }

  const handleExportSummary = async () => {
    try {
      const response = await fetch("/api/export/summary")
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `รายงานสรุป_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล")
    }
  }

  // จัดเรียง Others/อื่นๆ ไว้ท้ายสุด
  const sortedCategories = [
    ...categories.filter(cat => cat.name !== "Others" && cat.name !== "อื่นๆ"),
    ...categories.filter(cat => cat.name === "Others" || cat.name === "อื่นๆ"),
  ];

  return (
    <div className="space-y-8">
      {/* กราฟและยอดสินค้าด้านบนซ้าย (ขนาดเล็ก) */}
      <div className="flex flex-row gap-4 items-start mb-2">
        <Card className="w-72">
          <CardContent className="p-3">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#f59e42" name="ยอดขาย (บาท)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-gray-500 mt-1 text-xs">ยอดขายรายวัน</div>
          </CardContent>
        </Card>
        <Card className="w-40 flex flex-col justify-center items-center">
          <CardContent className="p-3">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-3xl font-bold text-green-600 mb-1">{loadingStats ? '-' : totalProducts}</div>
              <div className="text-center text-gray-500 text-xs">จำนวนผลิตภัณฑ์ทั้งหมด</div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-56 flex flex-col justify-center items-center">
          <CardContent className="p-3">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-bold text-blue-600 mb-1">{loadingStats ? '-' : totalValue.toLocaleString()}</div>
              <div className="text-center text-gray-500 text-xs">ยอดมูลค่ารวมทั้งหมด (บาท)</div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-row items-center gap-4">
          <h2 className="text-3xl font-bold text-black">หมวดหมู่สินค้า</h2>
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded w-64 focus:outline-none focus:ring focus:border-black"
          />
        </div>
        {/* ปุ่มต่าง ๆ + ปุ่ม log */}
        <div className="mb-4 flex justify-between items-center gap-2">
          {/* ลบปุ่ม log ออก เหลือเฉพาะปุ่มอื่น ๆ */}
          {isAdmin && (
            <>
              <Button
                variant="outline"
                onClick={handleExportSummary}
                className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                รายงานสรุป
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCategories}
                className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                ส่งออกหมวดหมู่
              </Button>
              <Button
                variant="outline"
                onClick={onNavigateToUsers}
                className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
              >
                <Users className="w-4 h-4 mr-2" />
                จัดการผู้ใช้
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มหมวดหมู่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-card border-gray-300">
                  <DialogHeader>
                    <DialogTitle className="text-black">เพิ่มหมวดหมู่ใหม่</DialogTitle>
                  </DialogHeader>
                  <DialogDescription id="add-category-desc">
                    กรอกข้อมูลเพื่อเพิ่มหมวดหมู่ใหม่
                  </DialogDescription>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-black">
                        ชื่อหมวดหมู่
                      </Label>
                      <Input
                        id="name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="กรอกชื่อหมวดหมู่"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-black">
                        รายละเอียด
                      </Label>
                      <Textarea
                        id="description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="border-gray-300 focus:border-black focus:ring-black"
                        placeholder="กรอกรายละเอียดหมวดหมู่"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="icon" className="text-black">
                        ไอคอน (Emoji)
                      </Label>
                      <div className="flex gap-2 items-center">
                        <select
                          id="icon"
                          value={newCategory.icon}
                          onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                          className="border-gray-300 focus:border-black focus:ring-black rounded px-2 py-1"
                        >
                          {EMOJI_OPTIONS.map((emoji) => (
                            <option key={emoji} value={emoji}>{emoji}</option>
                          ))}
                        </select>
                        <span className="text-2xl">{newCategory.icon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="border-gray-300 text-black hover:bg-gray-50"
                    >
                      ยกเลิก
                    </Button>
                    <Button onClick={handleAddCategory} className="bg-black text-white hover:bg-gray-800">
                      เพิ่มหมวดหมู่
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedCategories
          .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((category) => (
            <Card
              key={category.id}
              className="border-gray-200 bg-card hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{category.icon}</div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(category)
                        }}
                        className="border-gray-300 text-black hover:bg-gray-50 h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="border-red-300 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-gray-300">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-black">ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "{category.name}" นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 text-black hover:bg-gray-50">
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => await handleDeleteCategory(category.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              ลบหมวดหมู่
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                <div className="space-y-3" onClick={() => handleNavigateToProducts(String(category.id), category.name)}>
                  <div>
                    <h3 className="font-semibold text-black text-lg group-hover:text-gray-700 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{category.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Package className="w-4 h-4 mr-1" />
                      {category.productCount} สินค้า
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md bg-card border-gray-300">
            <DialogHeader>
              <DialogTitle className="text-black">แก้ไขหมวดหมู่</DialogTitle>
            </DialogHeader>
            <DialogDescription id="edit-category-desc">
              แก้ไขข้อมูลหมวดหมู่ตามต้องการ
            </DialogDescription>
            {editingCategory && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name" className="text-black">
                    ชื่อหมวดหมู่
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description" className="text-black">
                    รายละเอียด
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-icon" className="text-black">
                    ไอคอน (Emoji)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <select
                      id="edit-icon"
                      value={editingCategory?.icon || ""}
                      onChange={(e) => editingCategory && setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      className="border-gray-300 focus:border-black focus:ring-black rounded px-2 py-1"
                    >
                      {EMOJI_OPTIONS.map((emoji) => (
                        <option key={emoji} value={emoji}>{emoji}</option>
                      ))}
                    </select>
                    <span className="text-2xl">{editingCategory?.icon}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300 text-black hover:bg-gray-50"
              >
                ยกเลิก
              </Button>
              <Button onClick={handleEditCategory} className="bg-black text-white hover:bg-gray-800">
                บันทึกการแก้ไข
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Log การใช้งาน */}
      {isLogDialogOpen && (
        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log การเพิ่ม ลบ แก้ไข สินค้า, หมวดหมู่, และบัญชีผู้ใช้</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-gray-700 text-sm">
              <p>ตัวอย่าง log (ยังไม่ดึงข้อมูลจริง):</p>
              <ul className="list-disc ml-6 mt-2">
                <li>[2024-06-01 10:00] admin เพิ่มสินค้า "A"</li>
                <li>[2024-06-01 10:05] admin ลบหมวดหมู่ "ของเล่น"</li>
                <li>[2024-06-01 10:10] admin แก้ไขบัญชีผู้ใช้ "user1"</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>ปิด</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Package, ArrowRight, Users, Download } from "lucide-react"

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
        await fetchCategories(); // ดึงข้อมูลใหม่หลัง update
        setEditingCategory(null);
        setIsEditDialogOpen(false);
      } else {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((c) => c.id !== categoryId))
  }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-black">หมวดหมู่สินค้า</h2>
          <p className="text-gray-600 mt-2">จัดการหมวดหมู่สินค้าในระบบ</p>
        </div>
        {/* แถบค้นหา */}
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded w-64 focus:outline-none focus:ring focus:border-black"
          />
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
                <DialogContent className="max-w-md bg-white border-gray-300">
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
        {categories
          .filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((category) => (
          <Card
            key={category.id}
            className="border-gray-200 bg-white hover:shadow-lg transition-shadow cursor-pointer group"
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
                      <AlertDialogContent className="bg-white border-gray-300">
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
                            onClick={() => handleDeleteCategory(category.id)}
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
          <DialogContent className="max-w-md bg-white border-gray-300">
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
    </div>
  )
}

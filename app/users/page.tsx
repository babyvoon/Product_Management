"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, User, Shield, ArrowLeft, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

interface User {
  id: string | number;
  username: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  createdAt: string;
}

interface UserPageProps {
  userData: {
    username: string
    role: "admin" | "user"
    name: string
  }
  onNavigateBack: () => void
}

export default function UserPage({ userData, onNavigateBack }: UserPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<{
    id: number
    username: string
    name: string
    email: string
    role: "admin" | "user"
    status: "active" | "inactive"
    createdAt: string
  } | null>(null)
  const [newUser, setNewUser] = useState<{
    username: string
    name: string
    email: string
    role: "admin" | "user"
    status: "active" | "inactive"
  }>({
    username: "",
    name: "",
    email: "",
    role: "user",
    status: "active",
  })

  // เพิ่มฟังก์ชัน fetchUsers
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*")
    console.log("fetchUsers data:", data); // debug log
    if (!error && data) {
      setUsers(data)
      // ถ้าไม่มี admin/user ในฐานข้อมูล ให้เพิ่มอัตโนมัติ
      const hasAdmin = data.some(u => u.username === "admin")
      const hasUser = data.some(u => u.username === "user")
      if (!hasAdmin || !hasUser) {
        const defaultUsers = [];
        if (!hasAdmin) defaultUsers.push({ username: "admin", name: "Admin User", email: "admin@example.com", role: "admin", status: "active" });
        if (!hasUser) defaultUsers.push({ username: "user", name: "Regular User", email: "user@example.com", role: "user", status: "active" });
        if (defaultUsers.length > 0) {
          await supabase.from("users").upsert(defaultUsers, { onConflict: "username" });
          // fetch ใหม่หลัง insert
          const { data: newData } = await supabase.from("users").select("*");
          setUsers(newData || []);
        }
      }
    }
  }

  // เพิ่ม useEffect เพื่อ fetch users ตอน mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = async () => {
    // ตัวอย่าง insert user (สมมติ newUser มีข้อมูลครบ)
    const { data, error } = await supabase.from("users").insert([
      newUser
    ])
    if (!error) {
      await fetchUsers(); // ดึงข้อมูลใหม่หลัง insert
      setNewUser({
        username: "",
        name: "",
        email: "",
        role: "user",
        status: "active",
      })
      setIsAddDialogOpen(false)
    } else {
      alert("เกิดข้อผิดพลาด: " + error.message)
    }
  }

  const handleEditUser = () => {
    if (editingUser) {
      setUsers(users.map((u) => (String(u.id) === String(editingUser.id) ? editingUser : u)))
      setEditingUser(null)
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteUser = (userId: string | number) => {
    setUsers(users.filter((u) => String(u.id) !== String(userId)))
  }

  const openEditDialog = (user: {
    id: number
    username: string
    name: string
    email: string
    role: "admin" | "user"
    status: "active" | "inactive"
    createdAt: string
  }) => {
    setEditingUser({ ...user })
    setIsEditDialogOpen(true)
  }

  const handleExportUsers = async () => {
    try {
      const response = await fetch("/api/export/users")
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `รายการผู้ใช้_${new Date().toLocaleDateString("th-TH").replace(/\//g, "-")}.xlsx`
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
          <h2 className="text-3xl font-bold text-black">จัดการผู้ใช้</h2>
          <p className="text-gray-600 mt-2">จัดการบัญชีผู้ใช้ในระบบ</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="ค้นหาผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-300 focus:border-black focus:ring-black"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportUsers}
            className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
          >
            <Download className="w-4 h-4 mr-2" />
            ส่งออก Excel
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มผู้ใช้
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-gray-300">
              <DialogHeader>
                <DialogTitle className="text-black">เพิ่มผู้ใช้ใหม่</DialogTitle>
              </DialogHeader>
              <DialogDescription id="add-user-desc">
                กรอกข้อมูลเพื่อเพิ่มผู้ใช้ใหม่
              </DialogDescription>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-black">
                    ชื่อผู้ใช้
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-black">
                    ชื่อ-นามสกุล
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-black">
                    อีเมล
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="border-gray-300 focus:border-black focus:ring-black"
                    placeholder="กรอกอีเมล"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-black">
                    บทบาท
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "user") => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-gray-300">
                      <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                      <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-black">
                    สถานะ
                  </Label>
                  <Select
                    value={newUser.status}
                    onValueChange={(value: "active" | "inactive") => setNewUser({ ...newUser, status: value })}
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
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-gray-300 text-black hover:bg-gray-50"
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleAddUser} className="bg-black text-white hover:bg-gray-800">
                  เพิ่มผู้ใช้
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-gray-200 bg-card">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-black">รายการผู้ใช้ ({filteredUsers.length} คน)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-black font-semibold">ชื่อผู้ใช้</TableHead>
                <TableHead className="text-black font-semibold">ชื่อ-นามสกุล</TableHead>
                <TableHead className="text-black font-semibold">อีเมล</TableHead>
                <TableHead className="text-black font-semibold">บทบาท</TableHead>
                <TableHead className="text-black font-semibold">สถานะ</TableHead>
                <TableHead className="text-black font-semibold">วันที่สร้าง</TableHead>
                <TableHead className="text-black font-semibold">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield className="w-4 h-4 text-black" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="font-medium text-black">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-black">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={user.role === "admin" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}
                    >
                      {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "default" : "secondary"}
                      className={user.status === "active" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}
                    >
                      {user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="border-gray-300 text-black hover:bg-gray-50"
                        disabled={user.username === userData.username}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                            disabled={user.username === userData.username}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-gray-300">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-black">ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600">
                              คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "{user.name}" นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 text-black hover:bg-gray-50">
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              ลบผู้ใช้
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-black">แก้ไขผู้ใช้</DialogTitle>
          </DialogHeader>
          <DialogDescription id="edit-user-desc">
            แก้ไขข้อมูลผู้ใช้ตามต้องการ
          </DialogDescription>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username" className="text-black">
                  ชื่อผู้ใช้
                </Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="border-gray-300 focus:border-black focus:ring-black"
                  disabled={editingUser.username === userData.username}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-black">
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email" className="text-black">
                  อีเมล
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role" className="text-black">
                  บทบาท
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: "admin" | "user") => setEditingUser({ ...editingUser, role: value })}
                  disabled={editingUser.username === userData.username}
                >
                  <SelectTrigger className="border-gray-300 focus:border-black focus:ring-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-gray-300">
                    <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status" className="text-black">
                  สถานะ
                </Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value: "active" | "inactive") => setEditingUser({ ...editingUser, status: value })}
                  disabled={editingUser.username === userData.username}
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
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-black hover:bg-gray-50"
            >
              ยกเลิก
            </Button>
            <Button onClick={handleEditUser} className="bg-black text-white hover:bg-gray-800">
              บันทึกการแก้ไข
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  })

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    username: "",
    email: "", // เพิ่ม email
    password: "",
    confirmPassword: "",
    role: "user" as "user",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginForm.username)
        .eq("password", loginForm.password)
        .single();
      console.log("login result:", data, error);

      if (data) {
        localStorage.setItem("currentUser", JSON.stringify({
          id: data.id, // เพิ่ม id
          username: data.username,
          role: data.role,
          name: data.name,
        }));
        router.replace("/");
      } else {
        alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
    setIsLoading(false);
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน")
      setIsLoading(false)
      return
    }

    if (registerForm.password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      setIsLoading(false)
      return
    }

    // Check if username already exists
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", registerForm.username)
      .single();

    if (data) {
      alert("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Register success
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          name: registerForm.name,
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          role: "user",
        },
      ])
      .select()
      .single();

    if (newUser) {
      // save user to localStorage
      localStorage.setItem("currentUser", JSON.stringify({
        id: newUser.id, // เพิ่ม id
        username: newUser.username,
        role: newUser.role,
        name: newUser.name,
      }));
      router.replace("/"); // กลับไปหน้าหลัก
    } else {
      alert("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Product Management</h1>
          <p className="text-gray-600">ระบบจัดการสินค้า</p>
        </div>

        <Card className="border-gray-200 bg-card shadow-lg">
          <CardHeader className="text-center border-b border-gray-200">
            <CardTitle className="text-black">เข้าสู่ระบบ / สมัครสมาชิก</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-background">
                <TabsTrigger value="login" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  เข้าสู่ระบบ
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-black data-[state=active]:text-white">
                  สมัครสมาชิก
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-black">
                      ชื่อผู้ใช้
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="กรอกชื่อผู้ใช้ของคุณ"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-black">
                      รหัสผ่าน
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="กรอกรหัสผ่านของคุณ"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                    {isLoading ? (
                      "กำลังเข้าสู่ระบบ..."
                    ) : (
                      <>
                        เข้าสู่ระบบ
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-black">
                      ชื่อ-นามสกุล
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="กรอกชื่อ-นามสกุลของคุณ"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-black">
                      ชื่อผู้ใช้
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="กรอกชื่อผู้ใช้ของคุณ"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-black">
                      อีเมล
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="กรอกอีเมลของคุณ"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-black">
                      รหัสผ่าน
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-black">
                      ยืนยันรหัสผ่าน
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        className="pl-10 pr-10 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                    {isLoading ? (
                      "กำลังสมัครสมาชิก..."
                    ) : (
                      <>
                        สมัครสมาชิก
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Product Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

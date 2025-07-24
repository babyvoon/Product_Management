"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { UserIcon, Shield, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import AuthPage from "./auth/page"
import CategoryPage from "./categories/page"
import UserPage from "./users/page"
import ProductsPage from "./products/page" // Declare ProductsPage here
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase";

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

interface UserData {
  username: string
  role: "admin" | "user"
  name: string
}

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'MacBook Pro 14"',
    description: "Apple MacBook Pro 14-inch with M3 chip",
    price: 59900,
    category: "Electronics",
    stock: 15,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 2,
    name: "iPhone 15 Pro",
    description: "Latest iPhone with titanium design",
    price: 39900,
    category: "Electronics",
    stock: 25,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 3,
    name: "AirPods Pro",
    description: "Wireless earbuds with noise cancellation",
    price: 8900,
    category: "Audio",
    stock: 50,
    image: "/placeholder.svg?height=100&width=100",
    status: "active",
  },
  {
    id: 4,
    name: "iPad Air",
    description: "Powerful tablet for work and creativity",
    price: 21900,
    category: "Electronics",
    stock: 8,
    image: "/placeholder.svg?height=100&width=100",
    status: "inactive",
  },
]

// ตัวอย่าง mock log data
const logData = [
  {
    datetime: "2024-06-01 10:00",
    user: "admin",
    action: "เพิ่มสินค้า",
    detail: '"A"',
  },
  {
    datetime: "2024-06-01 10:05",
    user: "admin",
    action: "ลบหมวดหมู่",
    detail: '"ของเล่น"',
  },
  {
    datetime: "2024-06-01 10:10",
    user: "admin",
    action: "แก้ไขบัญชีผู้ใช้",
    detail: '"user1"',
  },
];

export default function ProductManagement() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const { theme, setTheme } = useTheme();

  // dashboard state
  const [currentPage, setCurrentPage] = useState<"categories" | "products" | "users">("categories");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [showLogPage, setShowLogPage] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      router.replace("/auth");
    } else {
      setUserData(JSON.parse(savedUser));
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (showLogPage) {
      setLoadingLogs(true);
      supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          setLogs(data || []);
          setLoadingLogs(false);
        });
    }
  }, [showLogPage]);

  if (!checked) return null;
  if (!userData) return null;

  // handler
  const handleNavigateToProducts = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setCurrentPage("products");
  };
  const handleNavigateToUsers = () => setCurrentPage("users");
  const handleNavigateToCategories = () => {
    setCurrentPage("categories");
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-black cursor-pointer" onClick={handleNavigateToCategories}>
                Product Management
              </h1>
              {currentPage === "products" && selectedCategory && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">{selectedCategory.name}</span>
                </>
              )}
              {currentPage === "users" && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-600">จัดการผู้ใช้</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-background rounded-lg">
                {userData.role === "admin" && (
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 bg-transparent font-semibold mr-2"
                    onClick={() => setShowLogPage(true)}
                  >
                    Log การใช้งาน
                  </Button>
                )}
                <span className="text-sm font-medium text-black">{userData.name}</span>
                <span className="text-xs text-gray-500">(@{userData.username})</span>
                <span className="border border-gray-300 text-gray-700 text-xs rounded px-2 py-0.5 ml-2">
                  {userData.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                </span>
              </div>
              <button
                onClick={() => {
                  setUserData(null);
                  localStorage.removeItem("currentUser");
                  router.replace("/auth");
                }}
                className="border border-gray-300 text-black hover:bg-gray-50 bg-transparent rounded px-3 py-1"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showLogPage ? (
          <div className="max-w-3xl mx-auto bg-white rounded shadow p-8 mt-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setShowLogPage(false)}
                className="border-gray-300 text-black hover:bg-gray-50 bg-transparent"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                กลับ
              </Button>
              <h2 className="text-2xl font-bold text-black">Log การเพิ่ม ลบ แก้ไข สินค้า, หมวดหมู่, และบัญชีผู้ใช้</h2>
            </div>
            <div className="py-4 text-gray-700 text-sm">
              {loadingLogs ? (
                <div className="text-center py-8">กำลังโหลด log ...</div>
              ) : (
                <table className="min-w-full border border-gray-200 rounded">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border-b text-left">วันที่/เวลา</th>
                      <th className="px-4 py-2 border-b text-left">ผู้ใช้</th>
                      <th className="px-4 py-2 border-b text-left">กิจกรรม</th>
                      <th className="px-4 py-2 border-b text-left">ตำแหน่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log.id || idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{log.username}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{log.action}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{log.target_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <>
            {currentPage === "categories" && (
              <CategoryPage
                userData={userData}
                onNavigateToProducts={handleNavigateToProducts}
                onNavigateToUsers={handleNavigateToUsers}
              />
            )}
            {currentPage === "products" && selectedCategory && (
              <ProductsPage
                userData={userData}
                category={selectedCategory}
                onNavigateBack={handleNavigateToCategories}
              />
            )}
            {currentPage === "users" && userData.role === "admin" && (
              <UserPage userData={userData} onNavigateBack={handleNavigateToCategories} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

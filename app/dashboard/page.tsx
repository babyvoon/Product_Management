"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

interface DailyStat {
  date: string
  count: number
}

export default function DashboardPage() {
  const [dailyUsers, setDailyUsers] = useState<DailyStat[]>([])
  const [totalProducts, setTotalProducts] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      // ผู้ใช้ใหม่รายวัน (view: users_daily_count)
      const { data: userStats } = await supabase.from('users_daily_count').select('*')
      // ยอดสินค้า
      const { count: productCount } = await supabase.from('products').select('id', { count: 'exact', head: true })
      setDailyUsers(userStats || [])
      setTotalProducts(productCount || 0)
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard รายงานสถิติ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้ใหม่รายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyUsers} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366f1" name="ผู้ใช้ใหม่" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center items-center">
          <CardHeader>
            <CardTitle>ยอดสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl font-bold text-green-600 mb-2">{loading ? '-' : totalProducts}</div>
              <div className="text-center text-gray-500">(จำนวนสินค้าทั้งหมดในระบบ)</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
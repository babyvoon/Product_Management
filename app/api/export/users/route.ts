import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Fetch users data from Supabase
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Prepare data for Excel
    const excelData =
      users?.map((user, index) => ({
        ลำดับ: index + 1,
        ชื่อผู้ใช้: user.username,
        "ชื่อ-นามสกุล": user.name,
        อีเมล: user.email,
        บทบาท: user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป",
        สถานะ: user.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน",
        วันที่สร้าง: new Date(user.created_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        วันที่อัพเดท: new Date(user.updated_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })) || []

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // ลำดับ
      { wch: 15 }, // ชื่อผู้ใช้
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 30 }, // อีเมล
      { wch: 15 }, // บทบาท
      { wch: 12 }, // สถานะ
      { wch: 20 }, // วันที่สร้าง
      { wch: 20 }, // วันที่อัพเดท
    ]
    worksheet["!cols"] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายการผู้ใช้")

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename with current date
    const currentDate = new Date()
      .toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-")
    const filename = `รายการผู้ใช้_${currentDate}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    })
  } catch (error) {
    console.error("Export users error:", error)
    return NextResponse.json({ error: "Failed to export users data" }, { status: 500 })
  }
}

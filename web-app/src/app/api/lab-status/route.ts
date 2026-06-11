import { NextResponse } from "next/server"

import { getLabStatus } from "@/features/backend/lab-status"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(getLabStatus())
}

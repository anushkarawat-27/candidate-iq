import { NextResponse } from "next/server";

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound(resource: string = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

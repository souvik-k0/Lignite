import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                name: name || null,
                email,
                password: hashedPassword,
            })
            .returning();

        return NextResponse.json(
            { message: "User created successfully", userId: newUser.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name || !employeeId) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Step 1: Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Step 2: Create a UUID (like Supabase auth.users normally does)
      const userId = uuidv4();

      // Step 3: Insert into users table
      const { error: userErr } = await supabase.from("users").insert([
        {
          id: userId,
          email,
          employee_id: employeeId,
          role,
          password_hash: passwordHash,
          email_verified: false,
        },
      ]);

      if (userErr) throw userErr;

      // Step 4: Insert into user_profiles
      const { error: profileErr } = await supabase.from("user_profiles").insert([
        {
          user_id: userId,
          name,
          employee_id: employeeId,
        },
      ]);

      if (profileErr) throw profileErr;

      // Step 5: Insert into user_roles
      const { error: roleErr } = await supabase.from("user_roles").insert([
        {
          user_id: userId,
          role,
        },
      ]);

      if (roleErr) throw roleErr;

      setSuccess("Account created successfully!");
      setEmail("");
      setPassword("");
      setEmployeeId("");
      setName("");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Sign Up
          </button>
        </form>

        {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
        {success && <p className="text-green-600 mt-3 text-center">{success}</p>}
      </div>
    </div>
  );
};

export default Signup;

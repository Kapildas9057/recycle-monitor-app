import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("employee");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !employeeId || !name) {
      setError("Please fill in all fields");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create a Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to get user ID from Supabase.");

      // Step 2: Add entry to 'users' table
      const { error: userInsertError } = await supabase.from("users").insert([
        {
          email,
          employee_id: employeeId,
          role,
          password_hash: password, // ideally hash it, but for now store plain
        },
      ]);

      if (userInsertError) throw userInsertError;

      // Step 3: Add entry to 'user_profiles' table
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            user_id: userId,
            name,
            employee_id: employeeId,
          },
        ]);

      if (profileError) throw profileError;

      setSuccess("Signup successful! Please verify your email and log in.");
      setEmail("");
      setPassword("");
      setEmployeeId("");
      setName("");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
};

export default Signup;

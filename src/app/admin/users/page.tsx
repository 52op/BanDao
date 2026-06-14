"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_unlocked: boolean;
  unlock_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await adminFetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0) setUsers(json.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (id: number, role: string) => {
    setSaving(id);
    await adminFetch(`/api/admin/users?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
    setSaving(null);
  };

  const handleUnlockToggle = async (id: number, is_unlocked: boolean) => {
    setSaving(id);
    await adminFetch(`/api/admin/users?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_unlocked }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_unlocked } : u))
    );
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">用户管理</h1>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">ID</th>
              <th className="px-4 py-2 text-left font-medium">邮箱</th>
              <th className="px-4 py-2 text-left font-medium">角色</th>
              <th className="px-4 py-2 text-left font-medium">已解锁</th>
              <th className="px-4 py-2 text-left font-medium">最后登录</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{user.id}</td>
                <td className="px-4 py-2">
                  <div>{user.name || "-"}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={saving === user.id}
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={user.is_unlocked}
                    onChange={(e) => handleUnlockToggle(user.id, e.target.checked)}
                    disabled={saving === user.id}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {user.last_login_at || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

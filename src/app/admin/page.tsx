"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Users, BarChart3, TrendingUp } from "lucide-react";
import { adminFetch } from "@/lib/admin-client";

interface Stats {
  total_count: number;
  today_count: number;
  tool_count: number;
  user_count: number;
  tool_stats: { tool_slug: string; count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.code === 0) setStats(json.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">概览</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              工具总数
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tool_count ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              用户数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.user_count ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总使用次数
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_count ?? "-"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日使用
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_count ?? "-"}</div>
          </CardContent>
        </Card>
      </div>

      {stats?.tool_stats && stats.tool_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">工具使用排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.tool_stats.map((item) => (
                <div
                  key={item.tool_slug}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono">{item.tool_slug}</span>
                  <span className="text-muted-foreground">{item.count} 次</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

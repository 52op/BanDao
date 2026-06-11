"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useUnlock } from "./unlock-context";

export function UnlockDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { unlock } = useUnlock();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (code.trim()) {
      unlock();
      onOpenChange(false);
      setCode("");
      setError("");
    } else {
      setError("请输入解锁码");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            高级功能需要解锁
          </DialogTitle>
          <DialogDescription>
            请关注公众号 <span className="font-medium text-foreground">办到</span>{" "}
            并回复【验证码】获取免费解锁码
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="输入解锁码"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
          />
          <Button onClick={handleUnlock}>解锁</Button>
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface User {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    status: "active" as "active" | "inactive",
  });
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const { data } = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      status: user.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditUser(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleStatusToggle = (checked: boolean) => {
    setEditForm({ ...editForm, status: checked ? "active" : "inactive" });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/users?id=${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error("Failed to update user");
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...editForm } : u))
      );
      closeDialog();
    } catch {
      alert("Error updating user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">
        Admission Communication Module
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(users) &&
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className={user.status === "inactive" ? "bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.whatsapp}</TableCell>
                    <TableCell>
                      {user.createdAt
                        ? format(new Date(user.createdAt), "MMM d, yyyy h:mm a")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {(!Array.isArray(users) || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium mb-1"
              >
                Name
              </label>
              <Input
                id="edit-name"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Name"
                required
              />
            </div>
            <div>
              <label
                htmlFor="edit-email"
                className="block text-sm font-medium mb-1"
              >
                Email
              </label>
              <Input
                id="edit-email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                placeholder="Email"
                required
              />
            </div>
            <div>
              <label
                htmlFor="edit-whatsapp"
                className="block text-sm font-medium mb-1"
              >
                WhatsApp
              </label>
              <Input
                id="edit-whatsapp"
                name="whatsapp"
                value={editForm.whatsapp}
                onChange={handleEditChange}
                placeholder="WhatsApp"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.status === "active"}
                onCheckedChange={handleStatusToggle}
                id="status-switch"
              />
              <label htmlFor="status-switch">
                {editForm.status === "active" ? "Active" : "Inactive"}
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

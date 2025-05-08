"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Alert {
  id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) {
          throw new Error("Failed to fetch alerts");
        }
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.name}</TableCell>
                  <TableCell>{alert.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alert.status === "active" ? "default" : "secondary"
                      }
                    >
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {alert.createdAt
                      ? format(new Date(alert.createdAt), "MMM d, yyyy h:mm a")
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No alerts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

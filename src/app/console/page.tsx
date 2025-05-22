"use client";
import { saveAs } from "file-saver";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import CustomModal from "@/components/CustomModal";
import { StudentType } from "@/types/student";
import * as XLSX from "xlsx";
import { EventType } from "@/types/event";
import { CheckCircle, Download, Trash2, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Field {
  id: number;
  alertId: number;
  name: string;
  sequence: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

interface AlertType {
  id: number;
  name: string;
  template?: string | null;
  templatePreview?: string | null;
  previewText?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  fields: Field[];
}

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    alertId: "",
  });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelError, setExcelError] = useState<string>("");
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [eventToResend, setEventToResend] = useState<EventType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventType | null>(null);
  const [excelEntryCount, setExcelEntryCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts");
        if (!response.ok) throw new Error("Failed to fetch alerts");
        const data = await response.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch {
        setAlerts([]);
      }
    };
    fetchAlerts();
  }, []);

  const openDialog = () => {
    setForm({ name: "", type: "", description: "", alertId: "" });
    setSelectedAlert(null);
    setExcelFile(null);
    setExcelError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "alertId") {
      const alert = alerts.find((a) => a.id!.toString() === e.target.value);
      setSelectedAlert(alert || null);
      setExcelFile(null);
      setExcelError("");
    }
  };

  // Format student data from Excel for upload
  const handleStudentFormat = (
    dataArr: Record<string, string>[],
    eventId: number
  ) => {
    if (!selectedAlert) return [];
    const studentData: StudentType[] = [];
    for (let i = 0; i < dataArr.length; i++) {
      const obj = {
        eventId,
        whatsapp: dataArr[i]["WhatsApp No."],
        fields: [] as { fieldId: number; studentId: number; value: string }[],
      };
      for (let j = 0; j < selectedAlert.fields.length; j++) {
        obj.fields.push({
          fieldId: selectedAlert.fields[j].id,
          studentId: 0,
          value: dataArr[i][selectedAlert.fields[j].name] || "",
        });
      }
      studentData.push(obj);
    }
    return studentData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAlert && selectedAlert.fields.length > 0) {
      if (!excelFile) {
        setExcelError("Please upload an Excel file.");
        return;
      }
      if (excelError) return;
    }
    setSaving(true);
    try {
      // For now, just send event data. You can extend to send excel data as needed.
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to add event");
      const newEvent = await response.json();
      setEvents((prev) => [newEvent, ...prev]);

      // Parse Excel file and send student data
      if (excelFile) {
        const data = await excelFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json<Record<string, string>>(
          worksheet,
          {
            raw: false,
            
            ...({ cellDates: true } as unknown as XLSX.Sheet2JSONOpts),
          }
        );

        // --- Header validation ---
        if (!selectedAlert) {
          setExcelError("No alert selected.");
          setSaving(false);
          return;
        }
        const expectedFields = selectedAlert.fields.map((f) => f.name.trim());
        const headers = Object.keys(parsedData[0] || {}).map((h) => h.trim());
        const missingFields = expectedFields.filter(
          (f) => !headers.includes(f)
        );
        if (missingFields.length > 0) {
          setExcelError(
            `Excel is missing the following required columns: ${missingFields.join(
              ", "
            )}`
          );
          setSaving(false);
          return;
        }
        // --- End header validation ---

        const studentData = handleStudentFormat(parsedData, newEvent.id);
        console.log(studentData);

        const notificationNotSent: Record<string, string>[] = [];
        for (const student of studentData) {
          const studentResponse = await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
          });
          if (!studentResponse.ok) throw new Error("Failed to add student");
          const { notificationSuccess, fields, ...props } =
            (await studentResponse.json()) as StudentType;
          if (!notificationSuccess) {
            const obj: Record<string, string> = {};
            for (const fieldTemplate of selectedAlert?.fields ?? []) {
              obj[fieldTemplate.name as string] =
                fields.find((f) => f.fieldId === fieldTemplate.id)?.value ?? "";
            }
            // Convert all props to string
            const stringifiedProps: Record<string, string> = {};
            Object.entries(props).forEach(([key, value]) => {
              stringifiedProps[key] =
                value !== undefined && value !== null ? String(value) : "";
            });
            notificationNotSent.push({ ...stringifiedProps, ...obj });
          }
        }

        if (notificationNotSent.length > 0) {
          // Download excel file with notification not sent
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(notificationNotSent);
          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Notification Not Sent"
          );
          XLSX.writeFile(workbook, "notification_not_sent.xlsx");
        }
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      alert("Error adding event");
    } finally {
      setSaving(false);
      closeDialog();
    }
  };

  const handleDelete = (event: EventType) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDownloadTemplate = () => {
    if (!selectedAlert) return;

    // Extract field names for headers
    const headers = selectedAlert.fields
      .slice() // create a shallow copy to avoid mutating original array
      .sort((a, b) => a.sequence - b.sequence)
      .map((field) => field.name);
    headers.push("WhatsApp No.");

    // Create worksheet from headers only (as first row)
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Generate a buffer and save as .xlsx
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${selectedAlert.template}-template.xlsx`);
  };

  // Download all students for an event as Excel
  const handleDownloadStudents = async (eventId: number) => {
    const res = await fetch(`/api/students?eventId=${eventId}`);
    const students = await res.json();

    console.log(students);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(students);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "students.xlsx");
  };

  const handleResend = (event: EventType) => {
    setEventToResend(event);
    setResendDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="w-full max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-800 flex items-center gap-3">
          <span className="inline-block bg-green-100 text-green-700 rounded-full px-3 py-1 text-lg font-bold mr-2">
            BESC
          </span>
          Admission Communication Module
        </h1>
        <p className="text-gray-500 mb-8 text-lg">
          Manage and review all admission-related events in one place.
        </p>
        <div className="flex justify-end mb-4">
          <Button
            onClick={openDialog}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow flex items-center gap-2"
          >
            <Download className="w-4 h-4" />+ Add Event
          </Button>
        </div>
        <Card className="shadow-lg rounded-2xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="border border-gray-200 rounded-xl overflow-hidden">
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="py-3 px-4">Event Name</TableHead>
                  <TableHead className="py-3 px-4">Alert Name</TableHead>
                  <TableHead className="py-3 px-4">Total Students</TableHead>
                  <TableHead className="py-3 px-4">
                    Failed Notifications
                  </TableHead>
                  <TableHead className="py-3 px-4">Created At</TableHead>
                  <TableHead className="py-3 px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event, idx) => (
                  <TableRow
                    key={event.id}
                    className={
                      (idx % 2 === 0 ? "bg-white" : "bg-gray-50") +
                      " hover:bg-green-100 border-b border-gray-200 transition-colors"
                    }
                  >
                    <TableCell className="font-medium py-3 px-4">
                      {event.name}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge variant={"outline"}>{event.alertName}</Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                        {event.totalStudents}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold">
                        {event.nottificationFailed}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {event.createdAt ? String(event.createdAt) : "-"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-blue-600 hover:bg-blue-100"
                                onClick={() =>
                                  typeof event.id === "number" &&
                                  handleDownloadStudents(event.id)
                                }
                              >
                                <Download className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Download all students for this event
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-yellow-600 hover:bg-yellow-100"
                                onClick={() => handleResend(event)}
                              >
                                <RefreshCw className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Resend Notifications
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-100"
                                onClick={() => handleDelete(event)}
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete this event</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-gray-400"
                    >
                      No events found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <CustomModal open={dialogOpen} onClose={closeDialog}>
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Left: Form */}
            <div className="flex-1 p-8 w-1/3 bg-white rounded-l-2xl flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6">Event Alert</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Name */}
                <div>
                  <label
                    htmlFor="event-name"
                    className="block text-sm font-medium mb-1"
                  >
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="event-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                {/* Description (optional) */}
                <div>
                  <label
                    htmlFor="event-description"
                    className="block text-sm font-medium mb-1"
                  >
                    Description{" "}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <Textarea
                    id="event-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>
                {/* Alert Type */}
                <div>
                  <label
                    htmlFor="alert-type"
                    className="block text-sm font-medium mb-1"
                  >
                    Alert Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.alertId}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, alertId: value }));
                      const alert = alerts.find(
                        (a) => a.id!.toString() === value
                      );
                      setSelectedAlert(alert || null);
                      setExcelFile(null);
                      setExcelError("");
                    }}
                    required
                  >
                    <SelectTrigger id="alert-type">
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      {alerts.map((alert) => (
                        <SelectItem key={alert.id} value={alert.id!.toString()}>
                          {alert.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Upload Excel File */}
                <div>
                  <div className="flex justify-between">
                    <label
                      htmlFor="excel-file"
                      className="block text-sm font-medium mb-1"
                    >
                      Upload Excel File <span className="text-red-500">*</span>
                    </label>
                    {selectedAlert && (
                      <Button
                        type="button"
                        onClick={handleDownloadTemplate}
                        variant={"link"}
                        className="text-purple-500 "
                        size={"sm"}
                      >
                        Get Template
                      </Button>
                    )}
                  </div>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setExcelFile(file);
                      setExcelError("");
                      setExcelEntryCount(null);

                      if (file) {
                        const data = await file.arrayBuffer();
                        const workbook = XLSX.read(data, { type: "array" });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const parsedData =
                          XLSX.utils.sheet_to_json<Record<string, string>>(
                            worksheet
                          );
                        setExcelEntryCount(parsedData.length);
                      }
                    }}
                  />
                  {excelError && (
                    <div className="text-red-500 text-xs mt-1">
                      {excelError}
                    </div>
                  )}
                  {excelEntryCount !== null && (
                    <div className="text-green-600 text-sm mt-1">
                      Total entries: {excelEntryCount}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t mt-8">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
                    disabled={
                      saving || !form.name || !form.alertId || !excelFile
                    }
                  >
                    {saving ? "Saving..." : "Send"}
                  </Button>
                </div>
              </form>
            </div>
            {/* Divider */}
            <div className="w-px bg-gray-200 mx-0 md:mx-0" />
            {/* Right: Alert Preview */}
            <div className="w-2/3 flex flex-col items-center justify-center bg-gray-50 rounded-r-2xl p-8">
              <div className="mb-4 w-full text-center">
                <div className="text-lg font-semibold text-gray-700">
                  {selectedAlert?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {selectedAlert?.name}
                </div>
              </div>
              {/* {selectedAlert && selectedAlert.fields.length > 0 && (
                <div className="mb-4 w-full flex flex-wrap justify-center gap-2">
                  {selectedAlert.fields.map((field) => (
                    <span
                      key={field.id}
                      className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-200"
                    >
                      {field.name}
                    </span>
                  ))}
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                    WhatsApp No.
                  </span>
                </div>
              )} */}
              <div className="flex items-center justify-center bg-white rounded shadow border border-gray-100 mb-4">
                <Image
                  src={
                    selectedAlert?.template
                      ? `/${selectedAlert?.template}.png`
                      : "/event-illustration.png"
                  }
                  alt="Event Illustration"
                  width={550}
                  height={350}
                  className="rounded"
                />
              </div>
              <p className="text-gray-500 text-center text-sm">
                Easily add a new event and upload your Excel file.
                <br />
                Make sure to select the correct alert type!
              </p>
            </div>
          </div>
        </CustomModal>
        <AlertDialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resend Notifications</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to resend notifications for{" "}
                <span className="font-semibold">{eventToResend?.name}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8"
                onClick={async () => {
                  if (!eventToResend) return;
                  try {
                    const res = await fetch("/api/events/resend", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ eventId: eventToResend.id }),
                    });
                    if (res.ok) {
                      alert("Notifications resent!");
                    } else {
                      alert("Failed to resend notifications.");
                    }
                  } catch {
                    alert("Error resending notifications.");
                  } finally {
                    setResendDialogOpen(false);
                    setEventToResend(null);
                  }
                }}
              >
                Resend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{eventToDelete?.name}</span>?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white px-8"
                onClick={async () => {
                  if (!eventToDelete) return;
                  try {
                    const response = await fetch(
                      `/api/events?id=${eventToDelete.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                    if (!response.ok) {
                      alert("Unable to delete the event");
                    }
                    setEvents((prev) =>
                      prev.filter((ele) => ele.id !== eventToDelete.id)
                    );
                  } catch {
                    alert("Something went wrong");
                  } finally {
                    setDeleteDialogOpen(false);
                    setEventToDelete(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

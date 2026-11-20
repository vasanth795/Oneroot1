"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Search,
  ExternalLink,
  Paperclip,
  Clock,
  X,
  User,
  Building2,
  Globe,
  Loader2,
  FileText,
  ShieldAlert,
  Eye,
  MousePointerClick,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Importer } from "@/lib/types";
import { fetchOutreachEmailLogs, type OutreachEmailLogsResponse } from "@/lib/api";

interface OutreachEmailItem {
  _id: string;
  direction: "inbound" | "outbound";
  senderEmail: string;
  senderName?: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  snippet?: string;
  status: "unread" | "read" | "sent" | "delivered" | "failed" | "bounced" | "opened" | "clicked";
  sentAt?: string;
  createdAt: string;
  userName?: string;
  classification?: string;
  error?: string;
  trackingId?: string;
  openCount?: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  isOpenAppleMpp?: boolean;
  inferredFromClick?: boolean;
  clickCount?: number;
  firstClickedAt?: string;
  lastClickedAt?: string;
  importerId?: {
    _id?: string;
    companyName?: string;
    importerName?: string;
    country?: string;
    email?: string;
    contactPerson?: string;
  } | string;
}

interface OutreachViewProps {
  importers?: Importer[];
  onRefresh?: () => unknown;
  onSelectImporter?: (importer: Importer, initialTab?: "profile" | "emails") => void;
}

type FilterTab = "all" | "opened" | "sent" | "bounced";

export function OutreachView({
  importers = [],
  onRefresh,
  onSelectImporter,
}: OutreachViewProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<OutreachEmailLogsResponse | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<OutreachEmailItem | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchOutreachEmailLogs();
      setData(res);
      if (isManual) {
        toast.success("Outreach email logs refreshed");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to load outreach logs:", e);
      if (isManual) {
        toast.error(e?.response?.data?.message || e?.message || "Failed to load outreach logs");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered emails based on active tab & search query
  const filteredEmails: OutreachEmailItem[] = useMemo(() => {
    if (!data?.emails) return [];

    let list = (data.emails as unknown as OutreachEmailItem[]);

    if (tab === "opened") {
      list = list.filter(
        (e) => (e.openCount && e.openCount > 0) || e.status === "opened"
      );
    } else if (tab === "sent") {
      list = list.filter(
        (e) =>
          e.direction === "outbound" &&
          e.status !== "bounced" &&
          e.status !== "failed" &&
          e.classification !== "bounce"
      );
    } else if (tab === "bounced") {
      list = list.filter(
        (e) =>
          e.status === "bounced" ||
          e.status === "failed" ||
          e.classification === "bounce"
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => {
        const imp = typeof e.importerId === "object" && e.importerId !== null ? e.importerId : null;
        return (
          e.recipientEmail?.toLowerCase().includes(q) ||
          e.recipientName?.toLowerCase().includes(q) ||
          e.subject?.toLowerCase().includes(q) ||
          imp?.companyName?.toLowerCase().includes(q) ||
          imp?.importerName?.toLowerCase().includes(q) ||
          imp?.country?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [data, tab, search]);

  const stats = useMemo(() => {
    const rawEmails = ((data?.emails || []) as unknown as OutreachEmailItem[]);
    const sentCount = rawEmails.filter(
      (e) =>
        e.direction === "outbound" &&
        e.status !== "bounced" &&
        e.status !== "failed" &&
        e.classification !== "bounce"
    ).length;
    const deliveredCount = rawEmails.filter((e) => e.status === "delivered").length;
    const openedCount = rawEmails.filter(
      (e) => (e.openCount && e.openCount > 0) || e.status === "opened"
    ).length;
    const emailBounces = rawEmails.filter(
      (e) =>
        e.status === "bounced" ||
        e.status === "failed" ||
        e.classification === "bounce"
    ).length;
    const suppBounces = data?.bouncedSuppressions?.length || 0;
    const impBounces = data?.bouncedImporters?.length || 0;
    const bouncedCount = Math.max(emailBounces, suppBounces, impBounces);

    return {
      sent: Math.max(data?.stats?.totalSent || 0, sentCount),
      delivered: Math.max(data?.stats?.totalDelivered || 0, deliveredCount),
      opened: Math.max(data?.stats?.totalOpened || 0, openedCount),
      humanOpens: data?.stats?.humanOpens || openedCount,
      appleMppOpens: data?.stats?.appleMppOpens || 0,
      bounced: Math.max(data?.stats?.totalBounced || 0, bouncedCount),
      total: rawEmails.length,
    };
  }, [data]);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-slate-50/50 min-h-[500px]">
      {/* Header bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Email Outreach Activity
              </h2>
              <p className="text-xs text-slate-500">
                Tracking all direct personalized outreach emails and delivery/bounce events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-violet-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total Sent */}
        <div
          onClick={() => setTab("all")}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-2xs ${
            tab === "all"
              ? "border-violet-300 bg-violet-50/60 ring-2 ring-violet-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Outreach</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">All outbound emails</p>
        </div>

        {/* Opened Emails (Mailchimp-Grade Accuracy) */}
        <div
          onClick={() => setTab("opened")}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-2xs ${
            tab === "opened"
              ? "border-purple-300 bg-purple-50/60 ring-2 ring-purple-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900">Opened Emails</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Eye className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-purple-800">{stats.opened}</p>
            {stats.sent > 0 && (
              <span className="text-xs font-bold text-purple-600">
                ({Math.round((stats.opened / stats.sent) * 100)}%)
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-purple-600">Verified pixel & clicks</p>
        </div>

        {/* Sent & Active */}
        <div
          onClick={() => setTab("sent")}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-2xs ${
            tab === "sent"
              ? "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Sent Emails</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-800">{stats.sent}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600">Delivered to buyers</p>
        </div>

        {/* Bounced Emails */}
        <div
          onClick={() => setTab("bounced")}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-2xs ${
            tab === "bounced"
              ? "border-rose-300 bg-rose-50/60 ring-2 ring-rose-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Bounced Emails</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-800">{stats.bounced}</p>
          <p className="mt-0.5 text-[11px] text-rose-600">Undelivered / suppressed</p>
        </div>

        {/* Direct Spec Deck Attachment Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Specifications</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Paperclip className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-800 truncate" title="OneRoot_IPM_Turmeric_Europe_Specifications.pdf">
            IPM Turmeric Deck
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Auto-attached PDF specs</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "all"
                ? "bg-violet-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Outreach ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTab("opened")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "opened"
                ? "bg-purple-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Opened ({stats.opened})
          </button>
          <button
            type="button"
            onClick={() => setTab("sent")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "sent"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sent ({stats.sent})
          </button>
          <button
            type="button"
            onClick={() => setTab("bounced")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              tab === "bounced"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Bounced ({stats.bounced})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by buyer, company, email..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Loading outreach logs...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Mail className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {tab === "bounced"
                ? "No Bounced Emails"
                : tab === "sent"
                ? "No Sent Outreach Emails Found"
                : "No Outreach Emails Recorded Yet"}
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              {tab === "bounced"
                ? "Great news! None of your outreach emails have bounced."
                : "Use the ⚡ Send Email or ⚡ Bulk Send Outreach button on any verified importer to reach out directly with specification decks."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Recipient / Buyer</th>
                  <th className="px-4 py-3">Subject & Preview</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent By</th>
                  <th className="px-4 py-3 whitespace-nowrap">Sent At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.map((email) => {
                  const imp =
                    typeof email.importerId === "object" && email.importerId !== null
                      ? email.importerId
                      : null;
                  const isBounced =
                    email.status === "bounced" ||
                    email.status === "failed" ||
                    email.classification === "bounce";

                  return (
                    <tr
                      key={email._id}
                      onClick={() => setSelectedEmail(email)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${
                        isBounced ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Recipient */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-bold text-slate-900 truncate">
                          {imp?.companyName || imp?.importerName || email.recipientName || email.recipientEmail}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{email.recipientEmail}</p>
                        {imp?.country && (
                          <span className="mt-0.5 inline-block text-[10px] text-slate-400 font-medium">
                            {imp.country}
                          </span>
                        )}
                      </td>

                      {/* Subject & Preview */}
                      <td className="px-4 py-3 max-w-[320px]">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-800 truncate">{email.subject}</p>
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                            title="Specifications PDF Attached"
                          >
                            <Paperclip className="h-2.5 w-2.5" /> PDF
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {email.snippet || email.body?.slice(0, 80) || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isBounced ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" /> Bounced
                          </span>
                        ) : (email.openCount && email.openCount > 0) || email.status === "opened" ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-bold text-purple-800 border border-purple-200">
                              <Eye className="h-3 w-3 text-purple-600" /> Opened ({email.openCount || 1}x)
                            </span>
                            <div className="flex items-center gap-1">
                              {email.inferredFromClick && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md font-medium" title="Inferred open via link click">
                                  <MousePointerClick className="h-2.5 w-2.5" /> Click
                                </span>
                              )}
                              {email.isOpenAppleMpp && (
                                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-medium" title="Apple Mail Privacy Protection pre-fetch">
                                  Apple MPP
                                </span>
                              )}
                              {email.firstOpenedAt && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatTimestamp(email.firstOpenedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : email.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800 border border-blue-200">
                            <CheckCircle2 className="h-3 w-3" /> Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> Sent
                          </span>
                        )}
                        {email.error && (
                          <p className="text-[10px] text-rose-600 truncate max-w-[140px] mt-0.5" title={email.error}>
                            {email.error}
                          </p>
                        )}
                      </td>

                      {/* Sent By */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        <p className="font-medium text-slate-800">{email.userName || "OneRoot Sales"}</p>
                        <p className="text-[10px] text-slate-400">{email.senderEmail || "exports@oneroot.farm"}</p>
                      </td>

                      {/* Sent At */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{formatTimestamp(email.sentAt || email.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmail(email);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for Selected Email */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Email Details</h3>
                  <p className="text-[11px] text-slate-500">
                    Sent on {formatTimestamp(selectedEmail.sentAt || selectedEmail.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Meta pills */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">To:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedEmail.recipientName ? `${selectedEmail.recipientName} ` : ""}
                    &lt;{selectedEmail.recipientEmail}&gt;
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">From:</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedEmail.senderName ? `${selectedEmail.senderName} ` : ""}
                    &lt;{selectedEmail.senderEmail || "exports@oneroot.farm"}&gt;
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
                  <div className="mt-0.5">
                    {selectedEmail.status === "bounced" || selectedEmail.classification === "bounce" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                        <AlertTriangle className="h-3 w-3" /> Bounced
                      </span>
                    ) : (selectedEmail.openCount && selectedEmail.openCount > 0) || selectedEmail.status === "opened" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                        <Eye className="h-3 w-3" /> Opened ({selectedEmail.openCount || 1}x)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Sent Successfully
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Attachments:</span>
                  <div className="mt-0.5 flex items-center gap-1 text-slate-700 font-medium">
                    <Paperclip className="h-3 w-3 text-slate-500" />
                    <span>OneRoot_IPM_Turmeric_Europe_Specifications.pdf</span>
                  </div>
                </div>
              </div>

              {/* Mailchimp Open Tracking Analytics Card */}
              {((selectedEmail.openCount && selectedEmail.openCount > 0) || selectedEmail.firstOpenedAt || selectedEmail.clickCount) && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white">
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                      Email Open & Interaction Analytics
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                    <div className="bg-white rounded-lg p-2.5 border border-purple-100">
                      <span className="text-[10px] text-slate-500 font-medium">Total Opens</span>
                      <p className="text-base font-black text-purple-900 mt-0.5">
                        {selectedEmail.openCount || 1} time{(selectedEmail.openCount || 1) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-purple-100">
                      <span className="text-[10px] text-slate-500 font-medium">First Opened</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {formatTimestamp(selectedEmail.firstOpenedAt || selectedEmail.createdAt)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-purple-100">
                      <span className="text-[10px] text-slate-500 font-medium">Link Clicks</span>
                      <p className="text-base font-black text-indigo-900 mt-0.5">
                        {selectedEmail.clickCount || 0} click{(selectedEmail.clickCount || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-purple-100">
                      <span className="text-[10px] text-slate-500 font-medium">Accuracy Verification</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedEmail.inferredFromClick
                          ? "Inferred (Link Clicked)"
                          : selectedEmail.isOpenAppleMpp
                          ? "Apple MPP Proxy"
                          : "Verified Pixel Load"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Subject:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEmail.subject}</p>
              </div>

              {/* Body */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Message Content:</span>
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {selectedEmail.body}
                </div>
              </div>

              {/* Bounced info if any */}
              {selectedEmail.error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-600" /> Delivery Notice / Error:
                  </p>
                  <p className="mt-1 text-rose-800">{selectedEmail.error}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-3.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

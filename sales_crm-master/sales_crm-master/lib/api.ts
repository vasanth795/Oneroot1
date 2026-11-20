import axios from "axios";
import type { AuthUser } from "./auth";
import type {
  DailyActivityReport,
  SavedDayDetail,
  SavedDayListItem,
} from "./dailyActivity";
import type { OutreachDetailReport, OutreachTableReport } from "./outreachReport";
import type {
  DailyPriceByMethod,
  DailyPriceEntry,
  DailyPriceFarmingMethodId,
  DailyPriceLocationId,
} from "./dailyPrice";
import type { LeadDuplicateMatch } from "./leadDuplicates";
import type { LeadActivityLogEntry } from "./leadActivityLog";
import type {
  Task,
  TaskAlertId,
  TaskInput,
  TaskStatusId,
  TaskSummary,
} from "./tasks";
import type {
  ConnectLinkedInInput,
  CreateImporterInput,
  CreateLeadInput,
  CreateLinkedInLeadInput,
  CreateSupplierInput,
  DiscoveryLog,
  DiscoverySchedule,
  DiscoverySource,
  DiscoveryStatus,
  EmailMessage,
  EmailTemplate,
  Importer,
  Lead,
  LeadStatus,
  LinkedInAccountStatus,
  LinkedInLead,
  ScraperRunResult,
  ScraperStatusResponse,
  SendEmailReplyInput,
  Supplier,
  TeamMember,
  TriggerDiscoveryParams,
} from "./types";

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // If running in browser accessed via ngrok or any remote hostname, route API requests
  // through the Next.js /api rewrite proxy to avoid localhost connection failures
  if (typeof window !== "undefined") {
    const isRemote =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    if (isRemote && (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      return "/api";
    }
  }

  if (envUrl) {
    const base = envUrl.replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  return "http://localhost:5000/api";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function login(
  phone: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post<{ token: string; user: AuthUser }>(
    "/auth/login",
    { phone, password }
  );
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export interface LeadListParams {
  status?: LeadStatus | "all";
  responsible?: string;
  country?: string;
  search?: string;
  dateField?: "createdAt" | "updatedAt";
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
}

/** All filtering and ordering happens on the server. */
export async function fetchLeads(
  statusOrParams?: LeadStatus | LeadListParams
): Promise<Lead[]> {
  const params: LeadListParams =
    typeof statusOrParams === "string"
      ? { status: statusOrParams }
      : (statusOrParams ?? {});

  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const clean = String(value ?? "").trim();
    if (clean && clean !== "all") query[key] = clean;
  }

  const { data } = await api.get<Lead[]>("/leads", {
    params: Object.keys(query).length ? query : undefined,
  });
  return data;
}

export async function fetchLead(id: string): Promise<Lead> {
  const { data } = await api.get<Lead>(`/leads/${id}`);
  return data;
}

export async function checkLeadDuplicates(
  company: string,
  phones: string[] = [],
  leadType: "export" | "domestic" = "domestic"
): Promise<LeadDuplicateMatch[]> {
  const cleaned = phones.map((p) => p.trim()).filter(Boolean);
  if (company.trim().length < 2 && cleaned.length === 0) return [];
  const { data } = await api.get<LeadDuplicateMatch[]>(
    "/leads/check-duplicate",
    {
      params: {
        company,
        phones: cleaned.length ? cleaned.join(",") : undefined,
        leadType,
      },
    }
  );
  return data;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const { data } = await api.post<Lead>("/leads", input);
  return data;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get<Supplier[]>("/suppliers");
  return data;
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const { data } = await api.get<Supplier>(`/suppliers/${id}`);
  return data;
}

export async function createSupplier(
  input: CreateSupplierInput
): Promise<Supplier> {
  const { data } = await api.post<Supplier>("/suppliers", input);
  return data;
}

export async function updateSupplier(
  id: string,
  payload: Partial<CreateSupplierInput> & {
    followUpDate?: string | null;
    status?: LeadStatus;
  }
): Promise<Supplier> {
  const { data } = await api.patch<Supplier>(`/suppliers/${id}`, payload);
  return data;
}

export async function fetchImporters(): Promise<Importer[]> {
  const { data } = await api.get<Importer[]>("/importers");
  return data;
}

export async function fetchImporter(id: string): Promise<Importer> {
  const { data } = await api.get<Importer>(`/importers/${id}`);
  return data;
}

export async function createImporter(
  input: CreateImporterInput
): Promise<Importer> {
  const { data } = await api.post<Importer>("/importers", input);
  return data;
}

export async function updateImporter(
  id: string,
  payload: Partial<CreateImporterInput> & {
    followUpDate?: string | null;
    status?: LeadStatus;
  }
): Promise<Importer> {
  const { data } = await api.patch<Importer>(`/importers/${id}`, payload);
  return data;
}

export async function deleteImporter(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/importers/${id}`);
  return data;
}

export async function scrapeNewImporters(): Promise<ScraperRunResult> {
  const { data } = await api.post<ScraperRunResult>("/importers/scrape");
  return data;
}

export async function fetchScraperStatus(): Promise<ScraperStatusResponse> {
  const { data } = await api.get<ScraperStatusResponse>("/importers/scraper-status");
  return data;
}

// ------------------------------------------------------------------ Outreach

export interface OutreachSettings {
  sending_enabled: boolean;
  email1_subject: string;
  email1_body: string;
  email2_body: string;
  product_details: string;
  signature: string;
  sender_address: string;
  wait_hours: number;
  business_start_hour: number;
  business_end_hour: number;
  business_days: number[];
  default_daily_cap: number;
  min_gap_seconds: number;
  last_tick_at?: string;
  last_tick_result?: string;
  last_poll_at?: string;
  last_poll_result?: string;
}

export interface OutreachInbox {
  email: string;
  name: string;
  smtpHost: string;
  imapHost: string;
  hasImap: boolean;
  dailyCap: number;
  sentToday: number;
}

export interface OutreachStatus {
  settings: OutreachSettings;
  inboxes: OutreachInbox[];
  publicUrl: string;
  byStatus: Record<string, number>;
  eligibleNotEnrolled: number;
  suppressionCount: number;
  mergeFields: string[];
}

export interface OutreachQueueRow {
  _id: string;
  companyName?: string;
  importerName: string;
  contactPerson?: string;
  email?: string;
  country?: string;
  timezone: string;
  verification_grade?: string;
  outreach_enrolled?: boolean;
  outreach_status?: string;
  outreach_step?: number;
  outreach_next_send_at?: string;
  outreach_inbox?: string;
  outreach_last_error?: string;
  email_1_sent_at?: string;
  email_2_sent_at?: string;
  email_2_scheduled_at?: string;
  reply_detected_at?: string;
  bounce_detected_at?: string;
}

export interface SuppressionEntry {
  _id: string;
  email: string;
  reason: "unsubscribed" | "bounced" | "complaint" | "manual";
  note?: string;
  addedBy?: string;
  createdAt: string;
}

export async function fetchOutreachStatus(): Promise<OutreachStatus> {
  const { data } = await api.get<OutreachStatus>("/outreach/status");
  return data;
}

export async function saveOutreachSettings(update: Partial<OutreachSettings>): Promise<OutreachSettings> {
  const { data } = await api.put<{ success: boolean; settings: OutreachSettings }>("/outreach/settings", update);
  return data.settings;
}

export async function fetchOutreachQueue(): Promise<OutreachQueueRow[]> {
  const { data } = await api.get<OutreachQueueRow[]>("/outreach/queue");
  return data;
}

export async function previewOutreachEmail(step: 1 | 2, importerId?: string) {
  const { data } = await api.post<{ success: boolean; sample: boolean; subject: string; text: string; html: string; problems: string[] }>(
    "/outreach/preview",
    { step, importerId }
  );
  return data;
}

export async function sendOutreachTest(to: string, step: 1 | 2, importerId?: string) {
  const { data } = await api.post<{ success: boolean; from: string; warnings: string[] }>("/outreach/test-send", { to, step, importerId });
  return data;
}

export async function testOutreachInboxes() {
  const { data } = await api.post<{
    success: boolean;
    inboxes: { email: string; smtp: { ok: boolean; error?: string }; imap: { ok: boolean; error?: string } }[];
  }>("/outreach/inboxes/test", {}, { timeout: 120000 });
  return data;
}

export async function runOutreachNow() {
  const { data } = await api.post<{ success: boolean; result: Record<string, unknown> }>("/outreach/run-now", {}, { timeout: 300000 });
  return data.result;
}

export async function checkOutreachInboxNow() {
  const { data } = await api.post<{ success: boolean; result: Record<string, unknown> }>("/outreach/check-inbox-now", {}, { timeout: 300000 });
  return data.result;
}

export async function bulkStopOutreach(params: {
  ids?: string[];
  allWaitingFollowup?: boolean;
  allActive?: boolean;
}): Promise<{ success: boolean; count: number }> {
  const { data } = await api.post<{ success: boolean; count: number }>("/outreach/bulk-stop", params);
  return data;
}

export async function fetchSuppressions(): Promise<SuppressionEntry[]> {
  const { data } = await api.get<SuppressionEntry[]>("/outreach/suppressions");
  return data;
}

export async function addSuppression(email: string, note?: string) {
  const { data } = await api.post<{ success: boolean; stoppedSequences: number }>("/outreach/suppressions", { email, note });
  return data;
}

export async function removeSuppression(id: string) {
  await api.delete(`/outreach/suppressions/${id}`);
}

export interface VerificationStatus {
  provider: string;
  verifierConfigured: boolean;
  verifierNote: string;
  byEmailStatus: Record<string, number>;
  byGrade: Record<string, number>;
  neverChecked: number;
  readyForOutreach: number;
}

export interface VerifyResult {
  success: boolean;
  provider: string;
  verifierConfigured: boolean;
  verifierNote: string;
  checked: number;
  remaining: number;
  verified: number;
  risky: number;
  invalid: number;
  unverified: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  errors: number;
  results: { id: string; companyName: string; error?: string }[];
}

export async function fetchVerificationStatus(): Promise<VerificationStatus> {
  const { data } = await api.get<VerificationStatus>("/importers/verification/status");
  return data;
}

/** No ids → verifies importers never checked (or checked > 30 days ago), up to 100. */
export async function verifyImporters(ids?: string[]): Promise<VerifyResult> {
  const { data } = await api.post<VerifyResult>("/importers/verify", ids?.length ? { ids } : {}, {
    timeout: 10 * 60 * 1000,
  });
  return data;
}

export async function enrollImporter(id: string): Promise<Importer> {
  const { data } = await api.post<{ success: boolean; importer: Importer }>(`/importers/${id}/enroll`);
  return data.importer;
}

export async function unenrollImporter(id: string): Promise<Importer> {
  const { data } = await api.post<{ success: boolean; importer: Importer }>(`/importers/${id}/unenroll`);
  return data.importer;
}

export interface FindContactsResult {
  success: boolean;
  claudeSearch?: string; // "on" | "off: <reason>" | "stopped: <reason>"
  usedClaude?: number;
  checked: number;
  remaining: number;
  found: number;
  none: number;
  unreachable: number;
  errors: number;
  results: {
    id: string;
    companyName: string;
    status: "found" | "none" | "unreachable" | "error";
    email?: string;
    phone?: string;
    sourceUrl?: string;
    detail?: string;
  }[];
}

/** Reads missing emails/phones from importers' own websites (up to 50 per call). */
export async function findImporterContacts(ids?: string[]): Promise<FindContactsResult> {
  const { data } = await api.post<FindContactsResult>(
    "/importers/find-contacts",
    ids?.length ? { ids } : {},
    { timeout: 10 * 60 * 1000 }
  );
  return data;
}

/** Starts a run in the background; poll fetchDiscoveryLog(log._id) for progress. */
export async function triggerDiscoveryRun(
  params: TriggerDiscoveryParams
): Promise<{ success: boolean; log: DiscoveryLog }> {
  const { data } = await api.post<{ success: boolean; log: DiscoveryLog }>(
    "/importers/discovery/run",
    params
  );
  return data;
}

export async function uploadDiscoveryCsv(
  file: File
): Promise<{ success: boolean; log: DiscoveryLog }> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ success: boolean; log: DiscoveryLog }>(
    "/importers/discovery/upload-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function fetchDiscoveryLog(id: string): Promise<DiscoveryLog> {
  const { data } = await api.get<DiscoveryLog>(`/importers/discovery/logs/${id}`);
  return data;
}

export async function fetchDiscoveryStatus(): Promise<DiscoveryStatus> {
  const { data } = await api.get<DiscoveryStatus>("/importers/discovery/status");
  return data;
}

export async function fetchDiscoverySources(): Promise<DiscoverySource[]> {
  const { data } = await api.get<DiscoverySource[]>("/importers/discovery/sources");
  return data;
}

export async function createDiscoverySource(
  input: Pick<DiscoverySource, "url" | "kind"> & Partial<Pick<DiscoverySource, "name" | "country" | "notes">>
): Promise<DiscoverySource> {
  const { data } = await api.post<DiscoverySource>("/importers/discovery/sources", input);
  return data;
}

export async function updateDiscoverySource(
  id: string,
  update: Partial<Pick<DiscoverySource, "name" | "url" | "kind" | "country" | "notes" | "enabled">>
): Promise<DiscoverySource> {
  const { data } = await api.patch<DiscoverySource>(`/importers/discovery/sources/${id}`, update);
  return data;
}

export async function deleteDiscoverySource(id: string): Promise<void> {
  await api.delete(`/importers/discovery/sources/${id}`);
}

export async function fetchDiscoveryLogs(
  limit: number = 15
): Promise<DiscoveryLog[]> {
  const { data } = await api.get<DiscoveryLog[]>("/importers/discovery/logs", {
    params: { limit },
  });
  return data;
}

export async function fetchDiscoverySchedule(): Promise<DiscoverySchedule> {
  const { data } = await api.get<DiscoverySchedule>("/importers/discovery/schedule");
  return data;
}

export async function updateDiscoverySchedule(
  update: Partial<Omit<DiscoverySchedule, "kinds" | "filters">> & {
    kinds?: Partial<DiscoverySchedule["kinds"]>;
    filters?: Partial<DiscoverySchedule["filters"]>;
  }
): Promise<DiscoverySchedule> {
  const { data } = await api.patch<DiscoverySchedule>(
    "/importers/discovery/schedule",
    update
  );
  return data;
}

export async function fetchImporterEmails(
  importerId: string
): Promise<EmailMessage[]> {
  const { data } = await api.get<EmailMessage[]>(`/emails/importer/${importerId}`);
  return data;
}

export async function sendImporterEmailReply(
  importerId: string,
  input: SendEmailReplyInput
): Promise<EmailMessage> {
  const { data } = await api.post<EmailMessage>(
    `/emails/importer/${importerId}/reply`,
    input
  );
  return data;
}

export async function sendOneClickPersonalizedEmailApi(
  importerId: string,
  payload?: {
    templateId?: string;
    customSubject?: string;
    customBody?: string;
  }
): Promise<{ success: boolean; email: EmailMessage; importer: Importer }> {
  const { data } = await api.post<{
    success: boolean;
    email: EmailMessage;
    importer: Importer;
  }>(`/emails/importer/${importerId}/one-click-send`, payload || {});
  return data;
}

export async function simulateBuyerEmail(
  importerId: string,
  input?: { messageText?: string; subjectOverride?: string }
): Promise<EmailMessage> {
  const { data } = await api.post<EmailMessage>(
    `/emails/importer/${importerId}/simulate`,
    input || {}
  );
  return data;
}

export async function markEmailAsRead(id: string): Promise<EmailMessage> {
  const { data } = await api.patch<EmailMessage>(`/emails/${id}/read`);
  return data;
}

export async function fetchEmailTemplates(
  importerId?: string
): Promise<EmailTemplate[]> {
  const { data } = await api.get<EmailTemplate[]>("/emails/templates", {
    params: importerId ? { importerId } : undefined,
  });
  return data;
}

export interface OutreachEmailLogsResponse {
  success: boolean;
  stats: {
    totalSent: number;
    totalBounced: number;
    totalDelivered: number;
    totalReplies: number;
    totalOpened?: number;
    humanOpens?: number;
    appleMppOpens?: number;
    totalClicked?: number;
  };
  emails: (EmailMessage & {
    importerId?: Importer | string;
    classification?: string;
    error?: string;
  })[];
  bouncedSuppressions?: Array<{
    _id: string;
    email: string;
    reason: string;
    note?: string;
    createdAt?: string;
  }>;
  bouncedImporters?: Array<{
    _id: string;
    companyName?: string;
    importerName?: string;
    country?: string;
    email?: string;
    contactPerson?: string;
    outreach_status?: string;
    bounce_detected_at?: string;
    outreach_last_error?: string;
  }>;
}

export async function fetchOutreachEmailLogs(params?: {
  status?: string;
  search?: string;
}): Promise<OutreachEmailLogsResponse> {
  const { data } = await api.get<OutreachEmailLogsResponse>("/emails/outreach-logs", {
    params,
  });
  return data;
}

// LinkedIn Leads API
export async function fetchLinkedInLeads(): Promise<LinkedInLead[]> {
  const { data } = await api.get<LinkedInLead[]>("/linkedin");
  return data;
}

export async function fetchLinkedInLead(id: string): Promise<LinkedInLead> {
  const { data } = await api.get<LinkedInLead>(`/linkedin/${id}`);
  return data;
}

export async function createLinkedInLead(
  input: CreateLinkedInLeadInput
): Promise<LinkedInLead> {
  const { data } = await api.post<LinkedInLead>("/linkedin", input);
  return data;
}

export async function updateLinkedInLead(
  id: string,
  payload: Partial<CreateLinkedInLeadInput>
): Promise<LinkedInLead> {
  const { data } = await api.patch<LinkedInLead>(`/linkedin/${id}`, payload);
  return data;
}

export async function deleteLinkedInLead(
  id: string
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/linkedin/${id}`);
  return data;
}

export async function syncLinkedInLeadsApi(): Promise<{
  success: boolean;
  message: string;
  stats: { totalFound: number; newAdded: number; duplicatesSkipped: number };
  newLeads: string[];
}> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    stats: { totalFound: number; newAdded: number; duplicatesSkipped: number };
    newLeads: string[];
  }>("/linkedin/sync");
  return data;
}

export async function recordLinkedInOutreach(
  id: string,
  payload: { messageType: string; subject?: string; text: string }
): Promise<LinkedInLead> {
  const { data } = await api.post<LinkedInLead>(`/linkedin/${id}/outreach`, payload);
  return data;
}

export async function convertLinkedInToImporter(
  id: string
): Promise<{
  success: boolean;
  message: string;
  importer: Importer;
  lead: LinkedInLead;
}> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    importer: Importer;
    lead: LinkedInLead;
  }>(`/linkedin/${id}/convert-to-importer`);
  return data;
}

export async function fetchLinkedInAccountStatus(): Promise<LinkedInAccountStatus> {
  const { data } = await api.get<LinkedInAccountStatus>("/linkedin/account");
  return data;
}

export async function connectLinkedInAccount(
  input: ConnectLinkedInInput
): Promise<{ success: boolean; message: string; account: LinkedInAccountStatus }> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    account: LinkedInAccountStatus;
  }>("/linkedin/account/connect", input);
  return data;
}

export async function disconnectLinkedInAccount(): Promise<{
  success: boolean;
  message: string;
  account: LinkedInAccountStatus;
}> {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    account: LinkedInAccountStatus;
  }>("/linkedin/account/disconnect");
  return data;
}

export async function searchLiveLinkedInLeads(
  query?: string
): Promise<{
  success: boolean;
  message: string;
  stats: { totalFound: number; newAdded: number; duplicatesSkipped: number };
  newLeads: string[];
  accountName: string;
  searchedQuery: string;
}> {
  const { data } = await api.post("/linkedin/search-live", { query });
  return data;
}

export async function updateLead(
  id: string,
  payload: Partial<CreateLeadInput> & {
    followUpDate?: string | null;
    status?: LeadStatus;
  }
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}`, payload);
  return data;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}/status`, { status });
  return data;
}

export async function reassignLead(
  id: string,
  responsiblePerson: string
): Promise<Lead> {
  const { data } = await api.patch<Lead>(`/leads/${id}/assign`, {
    responsiblePerson,
  });
  return data;
}

export async function uploadLeadDocument(
  leadId: string,
  file: File
): Promise<Lead> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<Lead>(`/leads/${leadId}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteLeadDocument(
  leadId: string,
  docId: string
): Promise<Lead> {
  const { data } = await api.delete<Lead>(
    `/leads/${leadId}/documents/${docId}`
  );
  return data;
}

export async function addRemark(
  id: string,
  text: string,
  author?: string
): Promise<Lead> {
  const { data } = await api.post<Lead>(`/leads/${id}/remarks`, {
    text,
    author,
  });
  return data;
}

export async function fetchLeadActivityLog(
  leadId: string
): Promise<LeadActivityLogEntry[]> {
  const { data } = await api.get<LeadActivityLogEntry[]>(
    `/leads/${leadId}/activity-log`
  );
  return data;
}

/** Permanent. `confirmName` must match the lead's company name (admins only). */
export async function deleteLead(
  id: string,
  confirmName: string
): Promise<{ deleted: { _id: string; name: string }; removedDocuments: number }> {
  const { data } = await api.delete<{
    deleted: { _id: string; name: string };
    removedDocuments: number;
  }>(`/leads/${id}`, { data: { confirmName } });
  return data;
}

export async function fetchDailyActivity(params?: {
  date?: string;
  responsible?: string;
}): Promise<DailyActivityReport> {
  const { data } = await api.get<DailyActivityReport>("/activity/daily", {
    params,
  });
  return data;
}

export async function fetchSavedDays(params?: {
  userName?: string;
  userId?: string;
}): Promise<SavedDayListItem[]> {
  const { data } = await api.get<SavedDayListItem[]>("/activity/days", {
    params,
  });
  return data;
}

export async function saveDayReport(date?: string): Promise<SavedDayListItem> {
  const { data } = await api.post<SavedDayListItem>("/activity/days", {
    date,
  });
  return data;
}

export async function fetchSavedDay(id: string): Promise<SavedDayDetail> {
  const { data } = await api.get<SavedDayDetail>(`/activity/days/${id}`);
  return data;
}

export async function fetchOutreachTable(params?: {
  from?: string;
  to?: string;
  userName?: string;
}): Promise<OutreachTableReport> {
  const { data } = await api.get<OutreachTableReport>(
    "/activity/outreach-table",
    { params }
  );
  return data;
}

export async function fetchOutreachDetail(params: {
  date: string;
  userName: string;
}): Promise<OutreachDetailReport> {
  const { data } = await api.get<OutreachDetailReport>(
    "/activity/outreach-detail",
    { params }
  );
  return data;
}

export async function fetchDailyPrices(): Promise<DailyPriceEntry[]> {
  const { data } = await api.get<DailyPriceEntry[]>("/daily-prices");
  return data;
}

export async function createDailyPrice(input: {
  date?: string;
  prices: DailyPriceByMethod;
}): Promise<DailyPriceEntry> {
  const { data } = await api.post<DailyPriceEntry>("/daily-prices", input);
  return data;
}

export async function updateDailyPrice(
  id: string,
  input: { date?: string; prices: DailyPriceByMethod }
): Promise<DailyPriceEntry> {
  const { data } = await api.patch<DailyPriceEntry>(
    `/daily-prices/${id}`,
    input
  );
  return data;
}

export async function approveDailyPriceColumn(
  id: string,
  input: { method: DailyPriceFarmingMethodId; location: DailyPriceLocationId }
): Promise<DailyPriceEntry> {
  const { data } = await api.post<DailyPriceEntry>(
    `/daily-prices/${id}/approve`,
    input
  );
  return data;
}

export async function rejectDailyPriceColumn(
  id: string,
  input: { method: DailyPriceFarmingMethodId; location: DailyPriceLocationId }
): Promise<DailyPriceEntry> {
  const { data } = await api.post<DailyPriceEntry>(
    `/daily-prices/${id}/reject`,
    input
  );
  return data;
}

export async function fetchTasks(params?: {
  assignedTo?: string;
  status?: TaskStatusId;
  alert?: TaskAlertId;
}): Promise<Task[]> {
  const { data } = await api.get<Task[]>("/tasks", { params });
  return data;
}

export async function fetchTaskSummary(params?: {
  assignedTo?: string;
}): Promise<TaskSummary> {
  const { data } = await api.get<TaskSummary>("/tasks/summary", { params });
  return data;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>("/tasks", input);
  return data;
}

export async function updateTask(
  id: string,
  input: Partial<TaskInput> & { status?: TaskStatusId }
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, input);
  return data;
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatusId
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}/status`, { status });
  return data;
}

export async function addTaskUpdate(
  id: string,
  input: { text: string; status?: TaskStatusId }
): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/${id}/updates`, input);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data } = await api.get<TeamMember[]>("/team");
  return data;
}

export async function fetchLocationStates(): Promise<string[]> {
  const { data } = await api.get<string[]>("/locations/states");
  return data;
}

export async function fetchLocationDistricts(state: string): Promise<string[]> {
  const { data } = await api.get<string[]>("/locations/districts", {
    params: { state },
  });
  return data;
}

export async function fetchLocationTaluks(
  state: string,
  district: string
): Promise<string[]> {
  const { data } = await api.get<string[]>("/locations/taluks", {
    params: { state, district },
  });
  return data;
}

export async function fetchLocationVillages(
  state: string,
  district: string,
  taluk: string
): Promise<string[]> {
  const { data } = await api.get<string[]>("/locations/villages", {
    params: { state, district, taluk },
  });
  return data;
}

export async function lookupLocationByPincode(pincode: string): Promise<{
  pincode: string;
  state: string;
  district: string;
  taluk: string;
  village: string;
}> {
  const { data } = await api.get<{
    pincode: string;
    state: string;
    district: string;
    taluk: string;
    village: string;
  }>(`/locations/pincode/${pincode}`);
  return data;
}

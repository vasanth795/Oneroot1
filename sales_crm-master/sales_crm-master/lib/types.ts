export type LeadStatus =
  | "lead_generation"
  | "contact_established"
  | "requirement_understood"
  | "quotation_sent"
  | "closed_won"
  | "closed_lost";

/**
 * Column names from the previous board. Old activity-history rows still
 * reference them, and the API maps any stored one to a current status.
 */
export type LegacyLeadStatus =
  | "identity"
  | "in_progress"
  | "deal"
  | "junk"
  | "idle_critical"
  | "missed_follow"
  | "no_activity";

const LEGACY_STATUS_MAP: Record<LegacyLeadStatus, LeadStatus> = {
  identity: "lead_generation",
  in_progress: "requirement_understood",
  deal: "closed_won",
  junk: "closed_lost",
  // The auto-parking columns are gone; without a saved column, start over.
  idle_critical: "lead_generation",
  missed_follow: "lead_generation",
  no_activity: "lead_generation",
};

const LEGACY_STATUS_LABELS: Record<LegacyLeadStatus, string> = {
  identity: "Identity",
  in_progress: "In Progress",
  deal: "Deal",
  junk: "Junk",
  idle_critical: "Idle – Critical",
  missed_follow: "Missed Follow",
  no_activity: "No Activity",
};

export const DEFAULT_LEAD_STATUS: LeadStatus = "lead_generation";

export type Industry = "export" | "domestic";

export type LeadType = "supplier" | "export" | "domestic";

export interface SupplierDetails {
  supplierName?: string;
  supplierNumber?: string;
  supplierType?: string;
  materialType?: string;
  polishLevel?: string;
  region?: string;
  variety?: string;
  curcuminPercent?: number;
  grade?: string;
  price?: number;
  quantityKg?: number;
  freeKgsPerQuantity?: number;
  kgPerBag?: number;
  eachBagCost?: number;
  loadingState?: string;
  loadingDistrict?: string;
  paymentDays?: number;
  apmc?: "yes" | "no" | "";
  labourAndOtherExpenses?: number;
}

/** Supplier record from `suppliers` collection (API may include legacy lead-shaped fields). */
export interface Supplier {
  _id: string;
  name: string;
  company?: string;
  leadType?: "supplier";
  supplierDetails: SupplierDetails;
  product?: Product;
  responsiblePerson: string;
  followUpDate?: string | null;
  status: LeadStatus;
  remarks?: Remark[];
  documents?: LeadDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  supplierDetails: SupplierDetails & { supplierName: string };
  responsiblePerson: string;
  followUpDate?: string | null;
  status?: LeadStatus;
}

export type ImporterPipelineStatus =
  | "New"
  | "Verified"
  | "Emailed"
  | "Followed up"
  | "LinkedIn sent"
  | "Replied"
  | "Sample sent"
  | "Negotiation"
  | "Order"
  | "Lost";

export type ImporterEmailStatus = "unverified" | "verified" | "risky" | "invalid";
export type ImporterVerificationGrade = "A" | "B" | "C" | "Unrated";
export type ImporterSourceType =
  | "google_places"
  | "trade_fair"
  | "csv_upload"
  | "manual"
  | "web_scraper";
export type ImporterLinkedInTaskStatus = "to_send" | "sent" | "accepted" | "replied";

export interface ImporterTimelineEvent {
  status: string;
  note?: string;
  changed_by?: string;
  timestamp: string;
}

export interface Importer {
  _id: string;
  importerName: string;
  companyName?: string;
  contactPerson?: string;
  importerNumber: string;
  email?: string;
  website?: string;
  country?: string;

  // Provenance (Never invent lead data)
  source_url: string;
  fetched_at: string;
  source_type?: ImporterSourceType;
  raw_extracted_text?: string;
  website_domain?: string;

  // Verification & Scoring
  website_live?: boolean;
  website_status_code?: number;
  email_status?: ImporterEmailStatus;
  verification_score?: number;
  verification_grade?: ImporterVerificationGrade;
  verification_checked_at?: string;
  email_check_detail?: string;
  email_check_method?: string;
  website_check_detail?: string;

  // Discovery / contact provenance
  buyer_type?: string;
  buyer_evidence?: string;
  discovery_source_name?: string;
  contact_source_url?: string;

  // Pipeline Status & Timeline
  pipeline_status?: ImporterPipelineStatus;
  timeline?: ImporterTimelineEvent[];

  // Outreach Sequence
  outreach_enrolled?: boolean;
  outreach_status?: string;
  outreach_step?: number;
  outreach_wait_hours?: number;
  outreach_next_send_at?: string;
  outreach_inbox?: string;
  outreach_last_error?: string;
  email_1_sent_at?: string;
  email_2_scheduled_at?: string;
  email_2_sent_at?: string;
  thread_message_id?: string;
  recipient_timezone?: string;
  unsubscribed?: boolean;
  suppressed?: boolean;
  reply_detected_at?: string;
  bounce_detected_at?: string;

  // LinkedIn Queue
  linkedin_short_message?: string;
  linkedin_task_status?: ImporterLinkedInTaskStatus;
  linkedin_task_due?: string;
  linkedin_sent_at?: string;
  linkedin_replied_at?: string;

  // Trade Specs
  taxIdOrIec?: string;
  importerType?: string;
  products?: string[];
  materialType?: string;
  polishLevel?: string;
  curcuminPercent?: number;
  grade?: string;
  price?: number;
  quantityKg?: number;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  paymentTerms?: string;
  paymentDays?: number;
  state?: string;
  city?: string;
  address?: string;
  remarks?: string;
  responsiblePerson: string;
  followUpDate?: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImporterInput {
  importerName: string;
  companyName?: string;
  contactPerson?: string;
  importerNumber: string;
  email?: string;
  website?: string;
  country?: string;

  // Provenance
  source_url?: string;
  fetched_at?: string;
  source_type?: ImporterSourceType;
  raw_extracted_text?: string;
  website_domain?: string;

  taxIdOrIec?: string;
  importerType?: string;
  products?: string[];
  materialType?: string;
  polishLevel?: string;
  curcuminPercent?: number;
  grade?: string;
  price?: number;
  quantityKg?: number;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  paymentTerms?: string;
  paymentDays?: number;
  state?: string;
  city?: string;
  address?: string;
  remarks?: string;
  responsiblePerson: string;
  followUpDate?: string | null;
  status?: LeadStatus;
  pipeline_status?: ImporterPipelineStatus;
}

export interface ScraperStats {
  totalFound: number;
  newAdded: number;
  duplicatesSkipped: number;
}

export interface ScraperRunResult {
  success: boolean;
  message: string;
  stats: ScraperStats;
  newImporters: string[];
}

export interface ScraperStatusResponse {
  lastRun: {
    startedAt: string;
    finishedAt?: string;
    status: string;
    triggerType: string;
    totalFound: number;
    newAdded: number;
    duplicatesSkipped: number;
    newImporters: string[];
    message?: string;
  } | null;
  nextScheduledRun: string;
  isAutomated: boolean;
  totalImportersInDb: number;
}

export interface EmailMessage {
  _id: string;
  importerId: string;
  messageId?: string;
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
  receivedAt?: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  tags?: string[];
  inReplyTo?: string;
  // Mailchimp Tracking
  trackingId?: string;
  openCount?: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  isOpenAppleMpp?: boolean;
  inferredFromClick?: boolean;
  clickCount?: number;
  firstClickedAt?: string;
  lastClickedAt?: string;
  opens?: Array<{
    timestamp: string;
    ip?: string;
    userAgent?: string;
    isAppleMpp?: boolean;
    inferredFromClick?: boolean;
  }>;
  clicks?: Array<{
    url: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
  }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body?: string;
}

export interface SendEmailReplyInput {
  to?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}

export type LinkedInConnectionStatus =
  | "not_connected"
  | "connection_sent"
  | "connected"
  | "messaged"
  | "in_discussion"
  | "converted";

export interface LinkedInOutreachMessage {
  sentAt: string;
  messageType: "connection_request" | "inmail" | "followup" | "quote";
  subject?: string;
  text?: string;
  status?: "sent" | "replied";
}

export interface LinkedInLead {
  _id: string;
  fullName: string;
  headline?: string;
  companyName: string;
  jobTitle?: string;
  profileUrl: string;
  companyLinkedinUrl?: string;
  location?: string;
  country?: string;
  email?: string;
  phone?: string;
  connectionStatus: LinkedInConnectionStatus;
  targetProducts?: string[];
  curcuminPercent?: number;
  quantityKg?: number;
  notes?: string;
  outreachMessages?: LinkedInOutreachMessage[];
  status: LeadStatus;
  responsiblePerson: string;
  createdAt: string;
  updatedAt: string;
  templates?: {
    connectionNote: string;
    inmailSubject: string;
    inmailBody: string;
    followUpNote: string;
  };
}

export interface CreateLinkedInLeadInput {
  fullName: string;
  headline?: string;
  companyName: string;
  jobTitle?: string;
  profileUrl: string;
  companyLinkedinUrl?: string;
  location?: string;
  country?: string;
  email?: string;
  phone?: string;
  connectionStatus?: LinkedInConnectionStatus;
  targetProducts?: string[];
  curcuminPercent?: number;
  quantityKg?: number;
  notes?: string;
  responsiblePerson?: string;
  status?: LeadStatus;
}

export interface LinkedInAccountStatus {
  isConnected: boolean;
  accountName?: string;
  accountEmail?: string;
  profileUrl?: string;
  headline?: string;
  authMethod?: "session_cookie" | "oauth" | "api_key";
  connectedAt?: string;
  lastSyncAt?: string;
  totalLeadsFetched?: number;
  hasSessionCookie?: boolean;
  hasApiKey?: boolean;
}

export interface ConnectLinkedInInput {
  accountName: string;
  accountEmail?: string;
  profileUrl?: string;
  headline?: string;
  authMethod?: "session_cookie" | "oauth" | "api_key";
  sessionCookie?: string;
  apiKey?: string;
  accessToken?: string;
}

export interface ExportDetails {
  exportIndustryType?: string;
  materialType?: string;
  polishLevel?: string;
  minCurcumin?: number;
  moistureLevel?: number;
  minOilContent?: number;
  acceptGrade?: string;
  preferredOrigin?: string;
  quantityNeededKg?: number;
  kgPerBag?: number;
  maxPrice?: number;
  paymentDays?: number;
  deliveryState?: string;
  deliveryDistrict?: string;
  incoterm?: string;
  portDelivery?: string;
  paymentDaysAfterSailing?: number;
}

export type IndustryType =
  | "extraction"
  | "masala"
  | "feed"
  | "ethanol"
  | "starch"
  | "TRADING"
  | "FMCG";

export const INDUSTRY_TYPES: { id: IndustryType; label: string }[] = [
  { id: "extraction", label: "Extraction Company" },
  { id: "masala", label: "Masala Company" },
  { id: "feed", label: "Feed Company" },
  { id: "ethanol", label: "Ethanol Company" },
  { id: "starch", label: "Starch Company" },
  { id: "TRADING", label: "TRADING Company" },
  { id: "FMCG", label: "FMCG Company" },
];

export type ProductName =
  | "turmeric"
  | "tender_coconut"
  | "chilli"
  | "ginger"
  | "maize"
  | "rice_ddgs"
  | "corn_ddgs"
  | "dorb"
  | "rsm"
  | "soya_seed"
  | "jowar";

export const PRODUCT_OPTIONS: { id: ProductName; label: string }[] = [
  { id: "turmeric", label: "Turmeric" },
  { id: "tender_coconut", label: "Tender Coconut" },
  { id: "chilli", label: "Red Chilli" },
  { id: "ginger", label: "Ginger" },
  { id: "maize", label: "Maize" },
  { id: "rice_ddgs", label: "Rice DDGS" },
  { id: "corn_ddgs", label: "Corn DDGS" },
  { id: "dorb", label: "DORB" },
  { id: "rsm", label: "RSM" },
  { id: "soya_seed", label: "Soya seed" },
  { id: "jowar", label: "Jowar" },
];

export function getProductLabel(id?: string) {
  return PRODUCT_OPTIONS.find((p) => p.id === id)?.label ?? id ?? "";
}

export type CreditRating =
  | "A+"
  | "A"
  | "A-"
  | "BBB+"
  | "BBB"
  | "BBB-"
  | "BB+"
  | "BB"
  | "B+"
  | "B"
  | "B-"
  | "C"
  | "D";

export const CREDIT_RATINGS: { id: CreditRating; label: string }[] = [
  { id: "A+", label: "A+" },
  { id: "A", label: "A" },
  { id: "A-", label: "A-" },
  { id: "BBB+", label: "BBB+" },
  { id: "BBB", label: "BBB" },
  { id: "BBB-", label: "BBB-" },
  { id: "BB+", label: "BB+" },
  { id: "BB", label: "BB" },
  { id: "B+", label: "B+" },
  { id: "B", label: "B" },
  { id: "B-", label: "B-" },
  { id: "C", label: "C" },
  { id: "D", label: "D" },
];

export interface Product {
  name: string;
  quantity: number;
  price: number;
}

export interface LeadProduct {
  name: string;
  quantity: number;
  price: number;
}

export interface Remark {
  _id: string;
  text: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDocument {
  _id: string;
  name: string;
  url: string;
  viewUrl?: string;
  downloadUrl?: string;
  publicId?: string;
  resourceType?: "image" | "raw";
  format?: string;
  version?: number;
  bytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface LeadContactEntry {
  name?: string;
  /** Every number for this person; `phone` mirrors the first one. */
  phones?: string[];
  phone?: string;
  email?: string;
  designation?: string;
  linkedIn?: string;
  /** Free-text extras that don't fit the fixed fields — one line each. */
  otherDetails?: string[];
}

export interface OutreachLog {
  date?: string;
  call?: boolean;
  email?: boolean;
  whatsapp?: boolean;
}

export interface Lead {
  _id: string;
  createdBy?: string;
  leadType?: LeadType;
  name: string;
  contactPerson?: string;
  contactPersons?: string[];
  contacts?: LeadContactEntry[];
  designation?: string;
  phone?: string;
  whatsappNumbers?: string[];
  whatsappNumber?: string;
  email?: string;
  emails?: string[];
  company?: string;
  website?: string;
  linkedIn?: string;
  leadSource?: string;
  address?: string;
  country?: string;
  industryType?: IndustryType;
  creditRating?: string;
  companyTurnover?: number;
  sourcingRegion?: string;
  products?: LeadProduct[];
  product: Product;
  industry?: Industry;
  exportDetails?: ExportDetails;
  responsiblePerson: string;
  followUpDate?: string | null;
  dailyActivity?: string;
  dailyActivities?: string[];
  dailyActivityNote?: string;
  dailyActivitySetOn?: string;
  leadStatus?: string;
  status: LeadStatus;
  pipelineStatus?: string | null;
  /** From the API: when the lead was last actually worked, and days since. */
  lastActivityAt?: string | null;
  idleDays?: number | null;
  remarks: Remark[];
  documents: LeadDocument[];
  outreachLog?: OutreachLog;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  leadType?: LeadType;
  name: string;
  contactPerson?: string;
  contactPersons?: string[];
  contacts?: LeadContactEntry[];
  designation?: string;
  phone?: string;
  whatsappNumbers?: string[];
  whatsappNumber?: string;
  email?: string;
  emails?: string[];
  company?: string;
  website?: string;
  linkedIn?: string;
  leadSource?: string;
  address?: string;
  country?: string;
  industryType?: IndustryType;
  creditRating?: string;
  companyTurnover?: number;
  sourcingRegion?: string;
  products?: LeadProduct[];
  product?: Product;
  industry?: Industry;
  exportDetails?: ExportDetails;
  responsiblePerson: string;
  followUpDate?: string | null;
  dailyActivity?: string;
  dailyActivities?: string[];
  dailyActivityNote?: string;
  leadStatus?: string;
  status?: LeadStatus;
}

export const LEAD_STATUSES: {
  id: LeadStatus;
  label: string;
  color: string;
}[] = [
  { id: "lead_generation", label: "Lead Generation", color: "#6366f1" },
  { id: "contact_established", label: "Contact Established", color: "#0ea5e9" },
  { id: "requirement_understood", label: "Requirement Understood", color: "#8b5cf6" },
  { id: "quotation_sent", label: "Quotation Sent", color: "#f59e0b" },
  { id: "closed_won", label: "Closed Won", color: "#22c55e" },
  { id: "closed_lost", label: "Closed Lost", color: "#64748b" },
];

/** Activity Kanban columns — the full pipeline, in order. */
export const ACTIVITY_BOARD_STATUSES = LEAD_STATUSES;

const CURRENT_STATUS_IDS = new Set<string>(LEAD_STATUSES.map((s) => s.id));

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && CURRENT_STATUS_IDS.has(value);
}

/** Any status ever stored, current or legacy, resolved to a current one. */
export function normalizeLeadStatus(
  status: string | null | undefined,
  pipelineStatus?: string | null
): LeadStatus {
  if (isLeadStatus(status)) return status;
  const legacy = (status ?? "") as LegacyLeadStatus;
  if (
    legacy === "idle_critical" ||
    legacy === "missed_follow" ||
    legacy === "no_activity"
  ) {
    // Restore from the column it was parked from, which may itself be legacy.
    return normalizeLeadStatus(pipelineStatus, null);
  }
  return LEGACY_STATUS_MAP[legacy] ?? DEFAULT_LEAD_STATUS;
}

/** Label for any status id — current ones, and legacy ones in old history. */
export function leadStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  const current = LEAD_STATUSES.find((s) => s.id === status);
  if (current) return current.label;
  return LEGACY_STATUS_LABELS[status as LegacyLeadStatus] ?? status;
}

export function activityBoardColumnForStatus(
  status: string,
  pipelineStatus?: string | null
): LeadStatus {
  return normalizeLeadStatus(status, pipelineStatus);
}

export type DiscoverySourceKind = "trade_fair" | "association" | "buy_leads";

export interface DiscoverySource {
  _id: string;
  name: string;
  url: string;
  kind: DiscoverySourceKind;
  country: string;
  enabled: boolean;
  notes?: string;
  lastRunAt?: string;
  lastStatus?: "ok" | "empty" | "blocked" | "error" | "";
  lastMessage?: string;
  lastFound?: number;
}

export interface DiscoverySourceResult {
  name: string;
  url: string;
  status: "ok" | "empty" | "blocked" | "error";
  message?: string;
  found?: number;
  method?: string;
}

export interface DiscoveryStatus {
  running: boolean;
  llm: { available: boolean; reason: string; model: string; provider?: string };
}

export interface DiscoveryLogItem {
  companyName: string;
  source_url: string;
  website_domain?: string;
  buyer_type?: string;
  status: "added" | "duplicate" | "rejected" | "error";
  reason?: string;
}

export interface DiscoveryLogStats {
  found: number;
  added: number;
  duplicates: number;
  rejected: number;
  errorCount: number;
}

export interface DiscoveryLog {
  _id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  triggerType: "scheduled" | "manual";
  sources: string[];
  filters: {
    country: string;
    city?: string;
    importerType?: string;
  };
  extraction?: { method: string; note: string };
  progress?: { total: number; processed: number };
  sourceResults?: DiscoverySourceResult[];
  stats: DiscoveryLogStats;
  errors: string[];
  items: DiscoveryLogItem[];
  message?: string;
  createdAt: string;
}

export interface DiscoverySchedule {
  _id?: string;
  enabled: boolean;
  scheduledTime: string; // HH:MM UTC
  timezone: string;
  kinds: Record<DiscoverySourceKind, boolean>;
  filters: { country: string; city: string; importerType: string };
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface TriggerDiscoveryParams {
  kinds: DiscoverySourceKind[];
  country?: string;
  city?: string;
  importerType?: string;
}


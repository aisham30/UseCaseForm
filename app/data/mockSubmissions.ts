import { type AdminSubmission } from "../lib/supabase";

export const mockSubmissions: AdminSubmission[] = [
  {
    id: "sub-101",
    employee_name: "Aisha Mendonsa",
    department: "R&D",
    affected_area: "Documentation",
    work_type: "Searching through files/data",
    friction: "Too many documents",
    frequency: "Multiple times daily",
    people_impacted: "My team",
    expected_support: "Smart search",
    systems_involved: ["PDFs", "Shared folders"],
    desired_outcome: "Finding historical clinical trial documentation for compound formulations immediately without manual keyword searches across directories.",
    created_at: "2026-05-18T10:14:00Z",
    status: "New",
    tags: ["AI"],
    admin_notes: [
      {
        id: "n-1",
        author: "Admin Coordinator",
        content: "We have over 40,000 PDFs in this shared folder. A Retrieval-Augmented Generation (RAG) search index would save several hours a day.",
        created_at: "2026-05-18T14:30:00Z"
      }
    ],
    assigned_owner: "Unassigned"
  },
  {
    id: "sub-102",
    employee_name: "Amit Patel",
    department: "Sales",
    affected_area: "Operations",
    work_type: "Copy-pasting between systems",
    friction: "Too much manual effort",
    frequency: "Daily",
    people_impacted: "Multiple teams",
    expected_support: "Automation",
    systems_involved: ["Excel", "Multiple systems"],
    desired_outcome: "Synchronizing customer outreach leads from marketing Excel sheets directly into our Salesforce CRM without manual entry errors.",
    created_at: "2026-05-19T08:30:00Z",
    status: "Under Review",
    tags: ["Automation", "Process Issue"],
    admin_notes: [
      {
        id: "n-2",
        author: "Lead Architect",
        content: "Checking if standard Salesforce API connection can be exposed, or if a lightweight n8n/Make automation pipeline is a better immediate fit.",
        created_at: "2026-05-19T10:15:00Z"
      }
    ],
    assigned_owner: "Automation Team"
  },
  {
    id: "sub-103",
    employee_name: "Dr. Helen Vance",
    department: "Finance",
    affected_area: "Reporting",
    work_type: "Preparing recurring reports",
    friction: "Too much manual effort",
    frequency: "Monthly",
    people_impacted: "Entire department",
    expected_support: "Dashboard/reporting",
    systems_involved: ["Excel", "SAP", "Power BI"],
    desired_outcome: "Automating the month-end reconciliation ledger reports for global entity taxation to reduce close cycle by 3 days.",
    created_at: "2026-05-10T14:22:00Z",
    status: "Approved",
    tags: ["Dashboard", "Compliance"],
    admin_notes: [
      {
        id: "n-3",
        author: "Finance Director",
        content: "Approved for Q3 roadmap. Fits perfectly with the corporate Power BI analytics migration standard.",
        created_at: "2026-05-12T09:00:00Z"
      }
    ],
    assigned_owner: "Analytics Support"
  },
  {
    id: "sub-104",
    employee_name: "Sanjay Shah",
    department: "HR",
    affected_area: "Approvals",
    work_type: "Tracking approvals/follow-ups",
    friction: "Human dependency",
    frequency: "Daily",
    people_impacted: "My team",
    expected_support: "Workflow system",
    systems_involved: ["Emails", "PDFs"],
    desired_outcome: "An automated tracking checklist for candidate background disclosures and employment contract approvals.",
    created_at: "2026-05-15T11:05:00Z",
    status: "New",
    tags: ["Needs Discussion"],
    admin_notes: [],
    assigned_owner: "Unassigned"
  },
  {
    id: "sub-105",
    employee_name: "Sarah Jenkins",
    department: "Supply Chain",
    affected_area: "Operations",
    work_type: "Manual repetitive work",
    friction: "Errors/rework",
    frequency: "Multiple times daily",
    people_impacted: "Multiple teams",
    expected_support: "AI assistant",
    systems_involved: ["Images/scans", "Shared folders", "SAP"],
    desired_outcome: "Automatically extracting shipping manifest numbers from scanned bill of lading manifests, matching them against SAP shipment records, and flagging mismatches.",
    created_at: "2026-05-20T04:12:00Z",
    status: "New",
    tags: ["AI", "Automation"],
    admin_notes: [
      {
        id: "n-4",
        author: "Supply Chain Manager",
        content: "We have an average of 40 delivery manifest errors daily, causing major receipt backlogs. High priority to fix this manifest matching gap.",
        created_at: "2026-05-20T08:00:00Z"
      }
    ],
    assigned_owner: "Unassigned"
  },
  {
    id: "sub-106",
    employee_name: "Dr. Rajesh Nair",
    department: "Manufacturing",
    affected_area: "Compliance",
    work_type: "Reviewing documents manually",
    friction: "Slow turnaround",
    frequency: "Weekly",
    people_impacted: "Entire department",
    expected_support: "AI assistant",
    systems_involved: ["PDFs", "Shared folders"],
    desired_outcome: "Accelerating quality assurance audit checklists for regulatory compliance certificates by automatically matching them to operating manuals.",
    created_at: "2026-05-14T09:45:00Z",
    status: "Implemented",
    tags: ["Compliance", "AI"],
    admin_notes: [
      {
        id: "n-5",
        author: "QA Auditor",
        content: "Pilot AI document review model completed. Certified checklists are now populated automatically in 4 minutes instead of 45 minutes.",
        created_at: "2026-05-18T16:00:00Z"
      }
    ],
    assigned_owner: "AI Solutions Team"
  },
  {
    id: "sub-107",
    employee_name: "Priya Sharma",
    department: "IT",
    affected_area: "Customer Support",
    work_type: "Decision-making based on data",
    friction: "No centralized system",
    frequency: "Daily",
    people_impacted: "Entire department",
    expected_support: "Smart search",
    systems_involved: ["Multiple systems", "Emails"],
    desired_outcome: "A centralized IT support agent assistant that fetches answers from historical Slack threads, Jira tickets, and internal wiki documents.",
    created_at: "2026-05-16T12:00:00Z",
    status: "Rejected",
    tags: ["Needs Discussion"],
    admin_notes: [
      {
        id: "n-6",
        author: "IT Lead",
        content: "Rejected as a separate project since we are migrating all corporate IT service requests to ServiceNow's built-in Virtual Agent tool next month.",
        created_at: "2026-05-17T11:30:00Z"
      }
    ],
    assigned_owner: "IT Operations"
  }
];

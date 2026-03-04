# AuditFlow Nepal

AuditFlow Nepal is a comprehensive professional audit and Chartered Accountant (CA) firm management platform engineered specifically for the Nepali regulatory and financial landscape. This platform digitizes the complete lifecycle of audit operations—from client onboarding and engagement management to document tracking, billable hour logging, and automated WhatsApp communication.

<img width="2536" height="1394" alt="image" src="https://github.com/user-attachments/assets/548fd3ba-0b8b-4549-b71e-af04f8cb73ab" />

## Core Philosophy


### Cloud Architecture
Firms can enable real-time cloud synchronization using Supabase. This allows for multi-device access, team collaboration, and automated backups while maintaining an offline-first resilient layer.

### Built for the Nepal Regulatory Framework
The platform is pre-configured with Nepal Standards on Auditing (NSA) terminology, IRD compliance rules (VAT, TDS, Income Tax, SSF), and Nepali fiscal year (Bikram Sambat) structures.

## Key Features

### Executive Dashboard
Provides a high-level overview of firm health, including active engagement status, revenue vs. collection analytics, and upcoming compliance deadlines tailored to the Nepali tax calendar.

### Comprehensive Client Management
Maintains a central repository of client data using PAN as a primary identifier. Each client profile includes a dynamic Health Score calculated from document completion, audit progress, and payment status.

### Audit Engagement Lifecycle
Full management of audit stages (Planning to Final Review) via a Kanban-style interface. Engagements include customizable digital checklists that automatically populate based on the type of audit (Statutory, Tax, Internal, NGO, etc.).

### Intelligent Document Tracking
Triggers and tracks document requests from clients. Integrated WhatsApp messaging allows for instant requests and follow-ups based on pre-configured templates, reducing the bottleneck of manual information collection.

### Time Tracking & Professional Billing
Includes a precision stopwatch for auditors to log billable hours against specific clients. Integrated invoicing generates professional fees in NPR, with status tracking from Draft to Paid.

### Nepal Compliance Knowledge Base
A searchable reference library containing localized tax laws, Companies Act 2063 summaries, and current IRD rates for VAT and TDS, serving as an on-the-field technical guide.

### AI Agent Governance
An immutable audit trail (Junior AI Agent Log) tracks all autonomous AI actions, such as document extraction or data reconciliation. Includes a Human-in-the-Loop (HITL) approval system for high-risk operations.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database / Backend**: Supabase (PostgreSQL with JSONB storage)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)
- **State Management**: React Context API
- **Icons**: Lucide React

## Development and Setup

### Local Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Configuration
To enable cloud sync:
1. Create a project at [Supabase](https://supabase.com).
2. Execute the provided migration scripts in the `supabase/migrations` directory.
3. Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the platform settings or environment variables.

## Security and Privacy

- **Data Ownership**: All data is owned by the CA firm. When used locally, data remains on the firm's devices. When cloud sync is enabled, data resides in the firm's private Supabase instance.
- **Isolation**: Row-Level Security (RLS) policies ensure complete data isolation between different firms.
- **Accountability**: Every action is logged in an internal registry for firm oversight.

## Roadmap and Pending Works

### In-Progress
- **Nepali Date System**: Implementation of a native BS calendar picker across all date-sensitive modules.
- **AI OCR Integration**: Enhancing the OCR engine to better handle Devanagari script for local invoice and document scanning.

### Future Development (To-Do)
- **Client Self-Service Portal**: A dedicated interface for clients to securely upload requested documents directly into the platform.
- **PDF Reporting Engine**: Automated generation of audit working paper sets and draft management letters in PDF format.
- **IRD Live Sync**: Direct integration with the Inland Revenue Department (IRD) portal for real-time filing status verification.
- **Mobile Application**: A React Native wrapper for on-the-go access to document tracking and time logging.
- **E-Signature Module**: Integrated digital signatures for engagement letters and management representation letters.
- **Bulk Reminders**: Automated batch WhatsApp notifications for recurring monthly compliance deadlines.

## Documentation
For a detailed breakdown of all functional modules and technical specifications, refer to the [AuditFlow Nepal Full Documentation](./AuditFlow-Nepal-Full-Documentation.md).

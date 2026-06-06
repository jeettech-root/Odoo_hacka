VendorBridge

Procurement & Vendor Management ERP

VendorBridge is a procurement-focused ERP system designed to streamline the complete procurement lifecycle—from RFQ creation and vendor bidding to approvals, purchase orders, invoicing, PDF generation, and automated email notifications.

---

Contents

"Overview" (#overview) •
"Features" (#features) •
"Workflow" (#procurement-workflow) •
"User Roles" (#user-roles) •
"Tech Stack" (#technology-stack) •
"Installation" (#installation) •
"Configuration" (#configuration) •
"Project Structure" (#project-structure) •
"Security" (#security-features) •
"Future Scope" (#future-enhancements)

---

Overview

VendorBridge connects Procurement Officers, Vendors, Managers, and Administrators through a centralized procurement platform.

The application simplifies procurement operations by managing the complete workflow from quotation requests to final invoice generation.

RFQ Creation
      ↓
Vendor Quotations
      ↓
Quotation Evaluation
      ↓
Approval Process
      ↓
Purchase Order Generation
      ↓
Invoice Creation
      ↓
PDF & Email Delivery

---

Features

- Request for Quotation (RFQ) Management
- Multi-Vendor Quotation Submission
- Automated Bid Comparison
- Best Bid Identification
- Approval Workflow Management
- Purchase Order Generation
- GST-Based Invoice Generation
- PDF Export Support
- Automated Email Notifications
- Role-Based Access Control (RBAC)
- JWT Authentication
- Secure API Access

---

User Roles

Procurement Officer

Responsible for managing procurement activities:

- Create and manage RFQs
- Assign vendors
- Compare quotations
- Request approvals
- Generate Purchase Orders
- Generate Invoices

Vendor

Responsible for participating in procurement requests:

- View assigned RFQs
- Submit quotations
- Update quotations before deadline
- Download Purchase Orders
- Download Invoices

Manager

Responsible for approval decisions:

- Review quotations
- Add remarks
- Approve requests
- Reject requests

Administrator

Responsible for system management:

- Manage users
- Manage permissions
- Configure application settings
- Maintain templates and logs
- Monitor database records

---

Procurement Workflow

Step 1 — RFQ Creation

The Procurement Officer creates an RFQ containing:

- Product Information
- Quantity
- Unit
- Submission Deadline
- Vendor Assignment

Step 2 — Vendor Quotation Submission

Assigned vendors submit quotations including:

- Quoted Price
- Delivery Timeline
- Additional Remarks

Each vendor can submit a single quotation per RFQ and may update it before the deadline.

Step 3 — Quotation Evaluation

The system compares all submitted quotations and automatically identifies the most competitive bid.

Best Bid = Lowest Qualified Quotation

Step 4 — Approval Request

The selected quotation is forwarded to the Manager for review and approval.

Step 5 — Manager Approval

The Manager can:

- Approve
- Reject
- Add Remarks

Approved quotations receive the following status:

Accepted

Step 6 — Purchase Order Generation

Purchase Orders are generated from approved quotations.

Purchase Order Lifecycle:

Draft → Issued → Completed

PO Number Format:

PO-YYYY-XXXX

Example:

PO-2026-0001

Step 7 — Invoice Generation

Invoices can be generated for Issued or Completed Purchase Orders.

Supported capabilities:

- GST Calculation
- PDF Invoice Generation
- Invoice Download
- Vendor Email Delivery

---

Technology Stack

Frontend

- React.js
- Vite
- JavaScript

Backend

- Node.js
- Express.js

Database

- MongoDB
- MongoDB Atlas

Supporting Services

- JWT Authentication
- Refresh Tokens
- Nodemailer
- PDFKit

---

Installation

Clone Repository

git clone <repository-url>
cd vendorbridge

Backend Setup

cd server
npm install
npm run dev

Frontend Setup

cd frontend
npm install
npm run dev

---

Configuration

Create a ".env" file inside the "server" directory.

PORT=3000

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/vendorbridge

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

---

Development URLs

Backend API

http://localhost:3000

Frontend Application

http://localhost:5173

---

Project Structure

VendorBridge
│
├── frontend
│   ├── public
│   ├── src
│   └── vite.config.js
│
├── server
│   ├── config
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── services
│   └── app.js
│
├── README.md
└── package.json

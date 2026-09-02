# Cyber Intel Hub

Below is a prompt that is specifically written for Lovable, assuming you will attach:

The Telecom Module PDF (source of truth for functionality)

The JSON mock datasets

Your screenshots (for reference only, not for design)

PROMPT FOR LOVABLE

Project Overview

I want you to build a production-quality Telecom Intelligence Dashboard for the National Cyber Crime Reporting Portal (NCRP).

The attached PDF is the source of truth for all functionality, workflow, navigation, drill-downs, and interactions.

Follow the PDF exactly for functionality.

DO NOT simplify anything.

Implement every dashboard, every drill-down, every page, every interaction, every popup, every table, every hierarchy and every navigation mentioned inside the PDF.

The screenshots I attached are ONLY from my previous version.

They are NOT design references.

They only help you understand the rough layout and flow.

I want the UI completely redesigned.

MOST IMPORTANT REQUIREMENT

I DO NOT want the old government portal look.

I want a dashboard that looks like it belongs in

Palantir Gotham

Vercel

Linear

Stripe Dashboard

Retool

Cursor IDE

Arc Browser

Raycast

modern Bloomberg Terminal

modern SOC dashboards

Think

Minimal

Premium

Professional

Cyber Intelligence

Dark Navy

Modern

Luxury Enterprise Software

NOT old admin template.

NOT Bootstrap.

NOT Government website.

Design Language

The entire application should feel like a modern Intelligence Platform.

Use

Dark Navy

Slate

Gunmetal

Graphite

Black

with

Blue

Cyan

Purple

Emerald

accent colors.

Avoid

Orange

Yellow

Random Greens

Bright Red everywhere.

Red should ONLY appear for alerts.

Visual Style

Everything should have

rounded corners

soft shadows

glassmorphism where appropriate

blurred backgrounds

beautiful spacing

excellent typography

large breathing room

beautiful cards

smooth hover animations

micro interactions

subtle gradients

professional icons

Use

Inter

Geist

IBM Plex Sans

or SF Pro style typography.

Layout

Full height application.

Modern collapsible sidebar.

Floating top navigation.

Large dashboard workspace.

Sticky filters.

Sticky page header.

Responsive.

Desktop first.

Sidebar

The sidebar should feel like Linear or Vercel.

Icons.

Expandable sections.

Smooth animations.

No ugly accordions.

Each module should expand elegantly.

Sections

Telecom Module

• Mobile Numbers

Dashboard

Performance Report

Archive

Seized on SAMANVAYA

• IMEI

Dashboard

Performance

Seized

DoT Analysis

• SIM Point of Sale

Dashboard

Performance

Unified Search

Telecom Suspect Registry

Contact Details

Circulars

Feedback

Exactly as mentioned in the PDF.

Top Navigation

Modern floating navigation bar

Contains

Global Search

Notifications

Theme Toggle

User Profile

Role Badge

Secure Gateway Status

Sync Indicator

Current Date

Live Clock

Connection Status

Dashboard

This should become the most impressive part.

Instead of flat cards,

create premium analytics widgets.

Use

animated counters

mini charts

trend indicators

spark lines

status pills

live indicators

Each KPI should feel alive.

Hero Section

Instead of a boring warning bar,

create a beautiful

Cyber Intelligence Alert Banner

that supports

different severity

animated pulse

expand

dismiss

view details

Dashboard Cards

Each card should have

icon

title

main value

trend

last synced

status

hover effect

drill down button

mini graph

Use beautiful layouts.

Charts

Every chart should look premium.

Use

Area charts

Bar charts

Heatmaps

Treemaps

Geo maps

Line charts

Stacked bars

Donut charts

Activity timelines

Network graphs

instead of basic charts.

Tables

Tables should feel like Notion + Airtable.

Features

sticky headers

sorting

column resizing

column visibility

filtering

pagination

export

row selection

hover

context menu

loading skeleton

empty state

search

multi filters

status chips

Drill Downs

This is extremely important.

Everything that is clickable inside the PDF should actually be clickable.

Examples

State

↓

District

↓

Police Station

↓

Mobile Number

↓

Complaint

↓

Complaint Details

↓

Linked IMEI

↓

Blocking Timeline

↓

Pratibimb Profile

↓

SIM Supply Chain

↓

SDR

Exactly replicate all drill-downs mentioned in the document.

Modal Windows

Instead of ugly popups,

create premium modal windows.

Large.

Beautiful.

Sectioned.

Timeline.

Cards.

Attachments.

Status.

Actions.

Print.

Download.

Complaint Detail Screen

Create a beautiful complaint dossier.

Sections

Incident Summary

Victim Details

Fraud Timeline

Financial Details

Suspect Details

Telecom Logs

Linked Devices

Linked SIMs

Linked Complaints

Action History

Evidence

Map

Timeline

Everything should be beautifully arranged.

Maps

Whenever location exists,

display

interactive map

pins

clusters

heatmaps

district boundaries

route

coordinates

instead of raw latitude longitude.

Performance Reports

Completely redesign them.

Include

KPI cards

trend analysis

monthly growth

filters

interactive charts

drilldowns

comparisons

download buttons

Archive Pages

Beautiful searchable archive.

Timeline.

Advanced filters.

Status.

Date.

State.

District.

Operator.

Complaint.

IMEI.

Mobile.

Circulars

Instead of a table,

make it look like

a documentation portal.

Cards.

Search.

Categories.

Priority.

Preview.

Download.

Pinned.

Recent.

Contact Directory

Professional directory.

Search.

Avatar.

Role.

Department.

Phone.

Email.

Quick actions.

Feedback

Beautiful form.

Rating.

Suggestions.

Attachments.

Submission history.

Search

This should feel like Spotlight Search.

Global search.

Results grouped by

Complaints

Mobile Numbers

IMEIs

PoS

Circulars

Profiles

Recent

Pinned

Keyboard shortcuts

Command Palette

Animations

Everything should animate.

Sidebar

Cards

Tables

Filters

Charts

Hover

Page transitions

Drawer

Modal

Use Framer Motion.

Nothing should suddenly appear.

Colors

Primary

#0B1220

#111827

#1E293B

Accent

#2563EB

#3B82F6

#06B6D4

Success

#10B981

Warning

#F59E0B

Danger

#EF4444

Components

Every component should be reusable.

Card

Table

Metric

Modal

Timeline

Status Chip

Search

Filters

Tabs

Drawer

Command Palette

Charts

Data

Use the attached JSON files as the complete mock backend.

Every chart,

table,

popup,

filter,

drill-down,

summary,

detail page,

and KPI should derive from these JSON files rather than hardcoded values. These files include summaries, complaint details, state/district/PS hierarchies, IMEI summaries, PoS summaries, and linked entity data.

There should never be fake placeholder data when equivalent mock data exists.

Functionality

Every metric card should open a drill-down.

Every row should open details.

Every badge should be clickable.

Every chart should filter.

Every filter should affect the page.

Every search should work.

Every export button should generate downloadable CSV/PDF.

Every hierarchy should function exactly as defined in the PDF.

UX

No dead buttons.

No placeholder pages.

No "Coming Soon."

Every interaction should work.

Every navigation should work.

Every menu should work.

Every filter should work.

Every modal should work.

Responsiveness

Perfect on

1920

1600

1440

1366

1280

Tablet

No overflowing tables.

No broken layouts.

Tech Stack

Use

React

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

TanStack Table

React Query

Recharts (or another modern charting library)

Lucide Icons

React Router

Organize the project with clean reusable components and scalable folder structure.

Accessibility

Keyboard navigation

ARIA labels

Proper focus states

High contrast

Screen reader friendly

Performance

Lazy load pages

Virtualize large tables

Memoize expensive components

Use skeleton loaders

Avoid unnecessary re-renders

Final Objective

Do not recreate my existing screenshots.

Those screenshots represent the functionality only.

Your job is to create a world-class cyber intelligence platform that feels like software used by elite cybercrime investigation agencies.

When someone opens the application, they should immediately think:

"This looks like Palantir."

"This feels like a premium enterprise intelligence platform."

"This is polished enough to demo to a government ministry or a Fortune 500 client."

Preserve 100% of the workflow, hierarchy, pages, navigation, and interactions described in the attached PDF, but completely reinvent the visual design into a sleek, modern, high-end intelligence dashboard with exceptional UX and pixel-perfect execution.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a96ad6d8-6647-44fe-9dd2-0d1380e47466).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

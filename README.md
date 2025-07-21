# MediScribe AI

MediScribe AI is an intelligent clinical documentation platform designed to streamline the medical note-taking process for healthcare professionals. By leveraging advanced AI, the application automates transcription and structuring of clinical notes, significantly reducing administrative overhead and allowing clinicians to focus more on patient care.

## Application Feature Overview

### Core AI & Transcription Features

*   **AI-Powered Note Generation:** At its core, the application transforms raw conversational transcripts into structured, professional medical notes. It can generate various formats, including SOAP notes, Initial Consultations (H&P), Follow-up notes, and more. The AI intelligently extracts key metadata such as patient name, a suitable title, and a relevant medical specialty tag for automatic organization.
*   **Intelligent Transcription Services:**
    *   **Live Recording:** A real-time transcription feature allows for capturing patient-doctor conversations directly through the browser's microphone, with timestamps automatically added to the transcript for context.
    *   **Audio File Upload:** Users can upload pre-recorded audio files (e.g., MP3, WAV) for asynchronous transcription, offering flexibility in various clinical settings.

### Workflow & Productivity Tools

*   **Comprehensive Note Management:** A centralized dashboard provides a complete overview of all clinical notes. Users can search, filter (by tag, date range), and view notes in either a grid or list layout. Bulk actions allow for efficient archiving, moving, or deleting of multiple notes simultaneously.
*   **Advanced Template System:**
    *   **Custom Templates:** Users can create, save, and manage their own note templates using a rich-text editor to define specific headings and AI instructions.
    *   **"Automagic" Template Creation:** A standout feature allows users to upload an image or PDF of an existing form, which the AI then "automagically" converts into a fully functional, reusable digital template.
    *   **Default Templates:** A library of standard medical templates (e.g., Physical Exam, Procedure Note, Consult Letter) is available out-of-the-box.
*   **Patient Management:** The system automatically aggregates patient data from notes into a consolidated patient list. Each patient has a dedicated detail page showing their status (active/inactive based on configurable rules), key demographic information, and a complete history of all associated clinical notes.
*   **Macros & Shortcuts:** Users can create custom text-expansion macros (e.g., typing `.followup` and pressing space) to instantly insert frequently used text blocks, phrases, or paragraphs into their notes, dramatically speeding up the editing process.

### Security & Personalization

*   **Secure Authentication:** The platform is secured with robust user authentication, including email/password sign-in and optional Two-Factor Authentication (2FA) via SMS for an added layer of security.
*   **Data Privacy & Ownership:** All user data, including notes, templates, and patient information, is securely stored in Firestore. Strict security rules are in place to ensure that a user can only ever access their own data.
*   **In-Depth Customization:** A comprehensive settings page allows users to personalize their experience. They can manage their user profile, input clinic information (for use in letterheads), and set default AI preferences, such as the default template, note detail level, and output format.

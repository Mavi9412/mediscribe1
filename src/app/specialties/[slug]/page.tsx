

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { LandingHeader } from '@/components/landing/header';
import { LandingFooter } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Check, Edit, BookOpen, TestTube, Users, ListPlus, FileText, Briefcase, FileWarning, DollarSign, Bone, Hand, MessageSquare, Brain, HeartPulse, Shield, Wind, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';


const specialtyData = {
    cardiology: {
        name: "Cardiology",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Cardiologists",
            description: [
                "Cardiologists manage a busy schedule with consults, surgeries and high volumes of diagnostic reports like Echo and ECG only add to the workload.",
                "Mediscribe AI is your clinical documentation assistant, built to streamline your notes, consult letters, and cardiac summaries. Dictate, capture medical information, or record visits and generate clean, structured notes instantly."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Edit className="w-6 h-6 text-primary" />,
                title: "Complex Medical Notes",
                description: "Generate clean, formatted letters for consults and referrals that have a clear structure.",
                back: {
                    title: "Smart Summary",
                    description: "AI Summary for imaging, labs, and visit notes for fast pre-visit review"
                }
            },
            {
                icon: <BookOpen className="w-6 h-6 text-primary" />,
                title: "Repetitive Admin Tasks",
                description: "Time-consuming tasks like consults, referral letters, and dictation.",
                back: {
                    title: "One-Click Referral Letters & Handouts",
                    description: "Auto-generate consult & referral letters, patient instructions."
                }
            },
            {
                icon: <TestTube className="w-6 h-6 text-primary" />,
                title: "Specialty Specific Terminology",
                description: "Repetitive tasks of entering medical diagnoses, test results.",
                back: {
                    title: "Diagnosis Based Templates",
                    description: "Chart CHF, AFib, CAD, and more with accurate medical terminology"
                }
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Team Care",
                description: "Collaborative note authoring and sharing to save time on hand-offs.",
                back: {
                    title: "Shared Templates",
                    description: "Collaborate efficiently with consistent, shared documentation templates"
                }
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in COVID it is 5 pm - I saw 20 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "The cardiology-specific templates are a lifesaver. Mediscribe understands the nuances of my field.",
                author: "Dr. Chen",
                specialty: "Cardiology"
            },
            {
                quote: "I can finally focus on my patients instead of my keyboard. This has brought back the joy in my practice.",
                author: "Dr. Patel",
                specialty: "Cardiologist"
            }
        ],
        stats: [
            { value: "72%", label: "Reduction in Documentation Time" },
            { value: "92%", label: "Provider Satisfaction" },
            { value: "3.5x", label: "Increase in Face-to-Face Time" },
            { value: "41%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Neurology",
            slug: "neurology"
        }
    },
    neurology: {
        name: "Neurology",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Neurologists",
            description: [
                "A neurologist's work is detailed with stroke workups, seizure logs, neuro exams, and complex chronic conditions demand time and precision. Reviewing years of history and diagnostics can slow this down.",
                "Mediscribe is your clinical documentation assistant, designed to support neurologists with structured notes, summaries, and referrals. Dictate, capture medical information or record encounters and generate clean, consistent documentation, ready for your EMR. Customizable templates for Parkinson's, MS, epilepsy, and migraines streamline charting and support accurate, consistent communication across EMRs and referring providers."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Edit className="w-6 h-6 text-primary" />,
                title: "Complex Medical Histories",
                description: "Reviewing medical histories, labs, scans.",
                back: {
                    title: "Smart Summary",
                    description: "AI Summary for imaging, labs, and visit notes for fast pre-visit review."
                }
            },
            {
                icon: <BookOpen className="w-6 h-6 text-primary" />,
                title: "Specialty Specific Terminology",
                description: "Repetitive tasks of entering medical diagnoses, test results.",
                 back: {
                    title: "Diagnosis based Templates",
                    description: "Chart Parkinson's, MS, epilepsy and more with accurate medical terminology."
                }
            },
            {
                icon: <TestTube className="w-6 h-6 text-primary" />,
                title: "Repetitive Admin Tasks",
                description: "Time-consuming tasks like consults, referral letters, and dictation.",
                 back: {
                    title: "One-Click Referral Letters & Handouts",
                    description: "Auto-generate consult & referral letters, patient instructions."
                }
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Core Across Settings",
                description: "Needing to document hand-offs and collaborate with other team members.",
                back: {
                    title: "Flexible Documentation",
                    description: "Supports clinic, inpatient, telemedicine and offline recording on web and mobile."
                }
            },
            {
                icon: <ListPlus className="w-6 h-6 text-primary" />,
                title: "Multi-issue Visits",
                description: "Time consuming task of charting multiple issues in one visit.",
                back: {
                    title: "Problem Based A&P Templates",
                    description: "Organize plans by issues reviewed, ideal for MS, epilepsy, stroke, and more."
                }
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in LOVE!!! It is 5 pm - I saw 29 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
             {
                quote: "The neurology templates for MS and epilepsy are fantastic. Saves me so much time.",
                author: "Dr. Evans",
                specialty: "Neurology"
            },
            {
                quote: "Mediscribe's ability to summarize complex patient histories is a game-changer for my practice.",
                author: "Dr. Kim",
                specialty: "Neurologist"
            }
        ],
        stats: [
            { value: "68%", label: "Reduction in Documentation Time" },
            { value: "95%", label: "Provider Satisfaction" },
            { value: "3.6x", label: "Increase in Face-to-Face Time" },
            { value: "42%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Primary Care",
            slug: "primary-care"
        }
    },
    'primary-care': {
        name: "Primary Care",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Primary Care Physicians",
            description: [
                "Primary care physicians manage it all: chronic disease, preventive care, acute visits, and complex cases. But every hour spent charting or reviewing histories is time lost to patient care.",
                "Mediscribe AI is your clinical documentation assistant, designed for high-volume primary care. Dictate, capture medical information, or record visits and generate structured notes instantly—no templates to build, no learning curve, and no workflow disruption."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "High Patient Volume",
                description: "Shift focus between patients and admin work without effort or association.",
                back: {
                    title: "Swift Note in Seconds",
                    description: "Generate complete notes from dictation, notepad or recording. Built for high visit volume."
                }
            },
            {
                icon: <ListPlus className="w-6 h-6 text-primary" />,
                title: "Multi-Problem Visits",
                description: "Time-consuming task of charting for multi-problem visits.",
                back: {
                    title: "Problem-Based A&P Templates",
                    description: "Structure the assessment and plan by condition for clear, efficient documentation."
                }
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Complex Medical Histories",
                description: "Time-consuming task of reviewing and documenting complex histories.",
                back: {
                    title: "Smart Summary",
                    description: "AI Summary for lengthy medical records to support quicker, more informed decisions."
                }
            },
            {
                icon: <Briefcase className="w-6 h-6 text-primary" />,
                title: "Care Across Settings",
                description: "Needing to document hand-offs and collaborate with other team members.",
                back: {
                    title: "Flexible Documentation",
                    description: "Supports clinic, home, telemedicine, and offline charting on web and mobile."
                }
            },
            {
                icon: <FileWarning className="w-6 h-6 text-primary" />,
                title: "Billing Errors",
                description: "Errors that can result in missed or delayed billing opportunities.",
                back: {
                    title: "Built-In Billing Support",
                    description: "Suggests ICD-10, CPT codes, and differentials to optimize coding and reimbursement."
                }
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in LOVE!!! It is 5 pm - I saw 29 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "As a family doctor, I see a bit of everything. Mediscribe handles it all flawlessly.",
                author: "Dr. Garcia",
                specialty: "Primary Care Physician"
            },
            {
                quote: "The time saved on admin tasks allows me to see more patients without feeling rushed. It's incredible.",
                author: "Dr. Thompson",
                specialty: "Family Medicine"
            }
        ],
        stats: [
            { value: "75%", label: "Reduction in Documentation Time" },
            { value: "95%", label: "Provider Satisfaction" },
            { value: "3.5x", label: "Increase in Face-to-Face Time" },
            { value: "41%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Orthopedics",
            slug: "orthopedics"
        }
    },
    orthopedics: {
        name: "Orthopedics",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Orthopedic Surgeons",
            description: [
                "Orthopedic documentation can get repetitive—injury assessments, post-op visits, procedure notes, and coding all add up fast. You need to move quickly between cases without sacrificing quality.",
                "Mediscribe AI is your clinical documentation assistant, built for high-volume surgical and clinic workflows. Dictate, upload, or record to generate structured procedure notes, follow-ups, and consults—no formatting or cleanup needed."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Bone className="w-6 h-6 text-primary" />,
                title: "Repetitive Admin Tasks",
                description: "Dictating operative notes, clinic notes, and completing paperwork adds to the high-volume workload."
            },
            {
                icon: <Hand className="w-6 h-6 text-primary" />,
                title: "Loss of Clinical Detail",
                description: "Medical scribes may make small mistakes which impact the quality of documentation."
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Complex Medical Histories",
                description: "Reviewing medical histories, imaging, labs."
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Care Across Settings",
                description: "Needing to document hand-offs and collaborate with other team members with high-quality documentation."
            },
            {
                icon: <ListPlus className="w-6 h-6 text-primary" />,
                title: "Multi-issue Visits",
                description: "Time consuming task of documenting and organizing notes for multi-issue visits."
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in LOVE!!! It is 5 pm - I saw 29 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "Operative notes are done in seconds. The accuracy for orthopedic terminology is spot-on.",
                author: "Dr. Lee",
                specialty: "Orthopedic Surgeon"
            },
            {
                quote: "I can now complete all my clinic notes between patients. No more taking charts home.",
                author: "Dr. Rodriguez",
                specialty: "Orthopedics"
            }
        ],
        stats: [
            { value: "65%", label: "Reduction in Documentation Time" },
            { value: "90%", label: "Provider Satisfaction" },
            { value: "3.8x", label: "Increase in Face-to-Face Time" },
            { value: "47%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Psychiatry",
            slug: "psychiatry"
        }
    },
    psychiatry: {
        name: "Psychiatry",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Psychiatrists",
            description: [
                "Psychiatrists navigate complex patient narratives, where understanding nuance and history is key. Documenting sensitive information accurately is crucial for effective care.",
                "Mediscribe AI assists by structuring session notes, capturing key patient quotes, and organizing mental status exams. This ensures that every detail is recorded with the sensitivity and precision required in mental health."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Brain className="w-6 h-6 text-primary" />,
                title: "Mental Status Exams",
                description: "Standardized templates for documenting mental status exams efficiently."
            },
            {
                icon: <MessageSquare className="w-6 h-6 text-primary" />,
                title: "Patient Narratives",
                description: "Capture and structure long patient stories and dialogues accurately."
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Sensitive Documentation",
                description: "Secure and confidential handling of sensitive patient information."
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Collaborative Care",
                description: "Share comprehensive notes with therapists and other care team members."
            },
            {
                icon: <DollarSign className="w-6 h-6 text-primary" />,
                title: "Complex Billing",
                description: "Assists with coding for different therapy session lengths and types."
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in COVID it is 5 pm - I saw 20 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "Mediscribe captures the patient's narrative with such accuracy and empathy. It's an invaluable tool for mental health.",
                author: "Dr. Jacobs",
                specialty: "Psychiatrist"
            },
            {
                quote: "Documenting therapy sessions is now so much faster, giving me more mental energy for my patients.",
                author: "Dr. Williams",
                specialty: "Psychotherapy"
            }
        ],
        stats: [
            { value: "82%", label: "Reduction in Documentation Time" },
            { value: "94%", label: "Provider Satisfaction" },
            { value: "4.1x", label: "Increase in Face-to-Face Time" },
            { value: "50%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Pediatrics",
            slug: "pediatrics"
        }
    },
    pediatrics: {
        name: "Pediatrics",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Pediatricians",
            description: [
                "Pediatricians manage a fast-paced environment, from well-child visits to acute illnesses. Documenting growth charts, vaccination records, and developmental milestones requires speed and accuracy.",
                "Mediscribe AI streamlines pediatric workflows by automating note creation for common visits, tracking growth metrics, and flagging key developmental stages. This allows pediatricians to spend more quality time with their young patients and families."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Check className="w-6 h-6 text-primary" />,
                title: "Well-Child Visits",
                description: "Quickly document routine check-ups with age-appropriate templates."
            },
            {
                icon: <ListPlus className="w-6 h-6 text-primary" />,
                title: "Growth Charts",
                description: "Automated tracking and plotting of growth and developmental milestones."
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Vaccination Records",
                description: "Simplify the management and documentation of immunization schedules."
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Parent Communication",
                description: "Generate clear, concise summaries and educational materials for parents."
            },
            {
                icon: <Briefcase className="w-6 h-6 text-primary" />,
                title: "Care Coordination",
                description: "Easily share notes and updates with schools, specialists, and other caregivers."
            }
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in COVID it is 5 pm - I saw 20 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "Well-child visits are so much smoother now. Mediscribe helps me stay on schedule without sacrificing quality.",
                author: "Dr. Davis",
                specialty: "Pediatrician"
            },
            {
                quote: "Generating parent handouts and school notes is a breeze. A huge time-saver for any pediatric practice.",
                author: "Dr. Miller",
                specialty: "Pediatrics"
            }
        ],
        stats: [
            { value: "75%", label: "Reduction in Documentation Time" },
            { value: "96%", label: "Provider Satisfaction" },
            { value: "3.7x", label: "Increase in Face-to-Face Time" },
            { value: "45%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Internal Medicine",
            slug: "internal-medicine"
        }
    },
    'internal-medicine': {
        name: "Internal Medicine",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Internal Medicine",
            description: [
                "Internal medicine is complex. Chronic conditions, vague symptoms, and multi-problem visits all require precise documentation. Reviewing labs, reports, and consults can slow you down.",
                "Mediscribe AI is your clinical documentation assistant, built for internists and hospitalists. Dictate, capture medical information, or record and generate structured notes, handouts, and referrals, ready for your EMR in seconds."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Complex Medical Histories",
                description: "Reviewing years of medical records for new patients."
            },
            {
                icon: <Briefcase className="w-6 h-6 text-primary" />,
                title: "Care Across Settings",
                description: "Needing to document from multiple settings with quality connectivity."
            },
            {
                icon: <MessageSquare className="w-6 h-6 text-primary" />,
                title: "Multilingual Encounters",
                description: "Navigating language barriers in-person with real-time, translated documentation and patient communication."
            },
            {
                icon: <Edit className="w-6 h-6 text-primary" />,
                title: "Repetitive Admin Tasks",
                description: "Time consuming tools like consult & referral letters to slow down workflow."
            },
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in LOVE!!! It is 5 pm - I saw 29 patients today and I am going home with no charting to do!!",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "Managing patients with multiple chronic conditions is easier with Mediscribe's clear, organized notes.",
                author: "Dr. Wilson",
                specialty: "Internal Medicine"
            },
            {
                quote: "The multilingual support is a fantastic feature for my diverse patient population.",
                author: "Dr. Martinez",
                specialty: "Internist"
            }
        ],
        stats: [
            { value: "70%", label: "Reduction in Documentation Time" },
            { value: "92%", label: "Provider Satisfaction" },
            { value: "3.5x", label: "Increase in Face-to-Face Time" },
            { value: "41%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Allergy & Immunology",
            slug: "allergy-immunology"
        }
    },
    'allergy-immunology': {
        name: "Allergy & Immunology",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Allergists & Immunologists",
            description: [
                "Allergists manage detailed patient histories, from seasonal allergies to complex immune disorders. Accurate documentation of triggers, reactions, and treatment plans is critical.",
                "Mediscribe AI simplifies this by creating structured notes for allergy testing, immunotherapy visits, and patient intake. It helps ensure every detail is captured for effective, long-term care."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <TestTube className="w-6 h-6 text-primary" />,
                title: "Allergy Testing",
                description: "Standardized templates for documenting skin and blood test results."
            },
            {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "Immunotherapy Plans",
                description: "Track and manage long-term immunotherapy schedules and patient progress."
            },
            {
                icon: <ListPlus className="w-6 h-6 text-primary" />,
                title: "Detailed Histories",
                description: "Capture comprehensive environmental and food allergy histories with ease."
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Patient Education",
                description: "Generate clear, easy-to-understand handouts on allergen avoidance."
            },
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in COVID it is 5 pm - I saw 20 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "Documenting detailed allergy histories and immunotherapy plans is so much easier now.",
                author: "Dr. Clark",
                specialty: "Allergist"
            },
            {
                quote: "Mediscribe's structured notes are perfect for tracking patient progress over time. Highly recommended.",
                author: "Dr. Baker",
                specialty: "Immunology"
            }
        ],
        stats: [
            { value: "76%", label: "Reduction in Documentation Time" },
            { value: "93%", label: "Provider Satisfaction" },
            { value: "3.9x", label: "Increase in Face-to-Face Time" },
            { value: "48%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Emergency Medicine",
            slug: "emergency-medicine"
        }
    },
    'emergency-medicine': {
        name: "Emergency Medicine",
        dayInTheLife: {
            title: "Day in the Life",
            subtitle: "Emergency Medicine Physicians",
            description: [
                "In the ER, every second counts. Physicians need to document rapidly and accurately while managing multiple critical patients. There's no time for cumbersome EMRs.",
                "Mediscribe AI is built for the fast-paced ER environment. Dictate on the go, add medical reassessments instantly, and generate discharge summaries in seconds. It's the co-pilot every ER doc needs."
            ],
            image: "https://uploads.onecompiler.io/43q6bm5a6/43r2hyncs/image.png",
            imageHint: "AI robot assistant"
        },
        features: [
            {
                icon: <Wind className="w-6 h-6 text-primary" />,
                title: "Rapid Dictation",
                description: "Capture notes and orders with your voice while moving between patients."
            },
            {
                icon: <HeartPulse className="w-6 h-6 text-primary" />,
                title: "Real-Time Updates",
                description: "Instantly add reassessments and updates to patient charts."
            },
            {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Discharge Summaries",
                description: "Generate comprehensive and clear discharge instructions in moments."
            },
            {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Team Handoffs",
                description: "Ensure seamless shift changes with clear, concise, and up-to-date notes."
            },
        ],
        testimonials: [
            {
                quote: "Note quality is impeccable. The support staff is top-notch.",
                author: "Dr. Miranda",
                specialty: "Family Medicine"
            },
            {
                quote: "Well I just want to say that I am in COVID it is 5 pm - I saw 20 patients today and I am going home with no charting to do!! This was just day 1 and I'm excited to try some consult notes...",
                author: "Dr. Langley",
                specialty: "Medical Doctor"
            },
            {
                quote: "Since incorporating Mediscribe into my charting routine, I've happily said goodbye to the homework I used to do at night.",
                author: "Dr. Belle Wu",
                specialty: "HCA Department of Surgery"
            },
            {
                quote: "This is a must-have for any ER doc. The speed and accuracy are unmatched.",
                author: "Dr. Turner",
                specialty: "Emergency Medicine"
            },
            {
                quote: "Discharge summaries are done in a fraction of the time. It has completely changed my workflow.",
                author: "Dr. Scott",
                specialty: "ER Physician"
            }
        ],
        stats: [
            { value: "80%", label: "Reduction in Documentation Time" },
            { value: "97%", label: "Provider Satisfaction" },
            { value: "4.5x", label: "Increase in Patient Throughput" },
            { value: "55%", label: "Reduction in Provider Burnout" }
        ],
        nextSpecialty: {
            name: "Cardiology",
            slug: "cardiology"
        }
    }
};

export default function SpecialtyPage() {
    const params = useParams();
    const slug = (params.slug || 'cardiology') as string;
    const data = specialtyData[slug as keyof typeof specialtyData] || specialtyData.cardiology;
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) {
            return
        }

        setCurrent(api.selectedScrollSnap())

        const handleSelect = (api: CarouselApi) => {
            setCurrent(api.selectedScrollSnap())
        }

        api.on("select", handleSelect)

        return () => {
            api.off("select", handleSelect)
        }
    }, [api])

    const featureGridClass = data.features.length === 5 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8";


    return (
        <div className="flex min-h-screen flex-col bg-background">
            <LandingHeader />
            <main className="flex-grow">
                {/* Day in the Life Section */}
                <section className="bg-white py-20 md:py-28">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <p className="font-semibold text-primary uppercase tracking-wider">{data.dayInTheLife.subtitle}</p>
                                <h1 className="text-4xl md:text-5xl font-bold text-gray-800">{data.dayInTheLife.title}</h1>
                                {data.dayInTheLife.description.map((text, i) => (
                                    <p key={i} className="text-gray-600 text-lg">{text}</p>
                                ))}
                                <Button size="lg" asChild>
                                    <Link href="/signup">Start Your Free Trial</Link>
                                </Button>
                            </div>
                            <div>
                                <Image 
                                    src={data.dayInTheLife.image} 
                                    alt="AI Assistant"
                                    width={500}
                                    height={500}
                                    data-ai-hint={data.dayInTheLife.imageHint}
                                    className="mx-auto" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-background py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Features Designed for {data.name}</h2>
                        <div className={featureGridClass}>
                            {data.features.map(feature => (
                                <div key={feature.title} className="group perspective-1000">
                                    <div className="relative w-full h-full transform-style-preserve-3d group-hover:rotate-y-180 transition-transform duration-700">
                                        {/* Front of card */}
                                        <div className="backface-hidden w-full h-full">
                                            <Card className="bg-white p-6 text-center shadow-lg h-full">
                                                <div className="flex justify-center mb-4">{feature.icon}</div>
                                                <h3 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h3>
                                                <p className="text-gray-600 text-sm">{feature.description}</p>
                                            </Card>
                                        </div>
                                        {/* Back of card */}
                                        <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180">
                                            <Card className="bg-white p-6 text-left shadow-lg h-full flex flex-col justify-center">
                                                {(feature as any).back ? (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                                                                <Check className="w-3 h-3 text-green-600" />
                                                            </div>
                                                        </div>
                                                        <h3 className="font-bold text-base text-gray-800 mb-1">{(feature as any).back.title}</h3>
                                                        <p className="text-gray-600 text-sm">{(feature as any).back.description}</p>
                                                    </>
                                                ) : (
                                                     <div className="text-center">
                                                        <h3 className="font-bold text-lg mb-2 text-primary-foreground">More Information</h3>
                                                        <p className="text-sm text-primary-foreground">This is the back of the card with more details about {feature.title}.</p>
                                                    </div>
                                                )}
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 md:py-28 bg-gray-800 text-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="max-w-3xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">Side Effects: Work-Life Balance</h2>
                        <p className="text-lg text-gray-300">
                            See what doctors around the world are saying about Mediscribe AI
                        </p>
                        </div>
                        <Carousel 
                            setApi={setApi}
                            className="w-full max-w-6xl mx-auto mt-16"
                            opts={{
                                align: "center",
                                loop: true,
                            }}>
                        <CarouselContent className="-ml-4">
                            {data.testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="basis-full lg:basis-1/3 pl-4">
                                <div className={cn(
                                    "p-1 h-full transition-all duration-500",
                                    current === index ? "" : "md:opacity-50 md:blur-sm md:scale-95"
                                )}>
                                    <Card className="bg-gray-700 border-gray-600 text-white h-full flex flex-col rounded-xl overflow-hidden relative">
                                        <CardContent className="p-8 flex-grow flex flex-col justify-between">
                                            <span className="absolute top-4 left-6 text-8xl font-serif text-gray-500/30">“</span>
                                            <div className="flex z-10">
                                                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor"/>)}
                                            </div>
                                            <p className="text-lg italic text-gray-300 my-4 z-10">"{testimonial.quote}"</p>
                                            <div className="mt-6 text-right pt-4 border-t border-gray-600 z-10">
                                                <p className="font-bold text-white">{testimonial.author}</p>
                                                <p className="text-sm text-gray-400">{testimonial.specialty}</p>
                                            </div>
                                            <span className="absolute bottom-4 right-6 text-8xl font-serif text-gray-500/30">”</span>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="bg-gray-600/50 hover:bg-gray-500/50 border-none text-white left-[-50px] hidden md:inline-flex" />
                        <CarouselNext className="bg-gray-600/50 hover:bg-gray-500/50 border-none text-white right-[-50px] hidden md:inline-flex" />
                        </Carousel>
                        <div className="text-center mt-12">
                            <Button asChild size="lg" variant="secondary">
                                <Link href="#">View More</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                 {/* Stats Section */}
                 <section className="py-20 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            {data.stats.map(stat => (
                                <div key={stat.label} className="text-center p-6 border rounded-lg">
                                    <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                    <p className="text-gray-500 mt-2">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gray-800">
                    <div className="container mx-auto px-4 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your {data.name} Practice?</h2>
                        <p className="text-lg text-gray-300 mb-8">Transform your {data.name.toLowerCase()} workflow, starting today</p>
                        <Button size="lg" variant="secondary">Request a Demo</Button>
                    </div>
                </section>

                {/* Next Specialty Section */}
                <section className="py-12 bg-background">
                    <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <p className="text-gray-500">EXPLORE MORE SPECIALTIES</p>
                            <p className="text-xl font-bold text-gray-800">Next: {data.nextSpecialty.name}</p>
                        </div>
                        <Button asChild>
                            <Link href={`/specialties/${data.nextSpecialty.slug}`}>Continue to {data.nextSpecialty.name}</Link>
                        </Button>
                    </div>
                </section>

            </main>
            <LandingFooter />
        </div>
    );
}

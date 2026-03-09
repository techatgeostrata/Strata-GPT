import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

# 1. System Setup
load_dotenv(".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 2. Upload Engine (Slices text into 800-word chunks)
def process_and_upload(text, metadata, chunk_size=800):
    if not text or len(text) < 50:
        print("⚠️ Text too short to process.")
        return
        
    words = text.split()
    total_chunks = (len(words) // chunk_size) + 1
    
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        
        try:
            print(f"⏳ Generating AI vector for chunk {(i//chunk_size) + 1} of {total_chunks}...")
            response = openai_client.embeddings.create(
                input=chunk,
                model="text-embedding-3-small"
            )
            embedding = response.data[0].embedding
            
            supabase.table("documents").insert({
                "content": chunk,
                "metadata": metadata,
                "embedding": embedding
            }).execute()
            print(f"✅ Uploaded chunk {(i//chunk_size) + 1}")
        except Exception as e:
            print(f"❌ Failed to upload chunk: {e}")

# ==========================================
# 3. PASTE YOUR DOCUMENT DETAILS HERE
# ==========================================

# Give it a clear title so the AI knows what it's looking at
DOCUMENT_TITLE = "Details about GEOSTRATA"

# We give it a fake Geostrata URL so your Next.js UI successfully renders it as a blue link!
DOCUMENT_URL = "https://thegeostrata.com/internal/private-report" 

DOCUMENT_TYPE = "article"

# PASTE YOUR ENTIRE TEXT BETWEEN THE TRIPLE QUOTES
RAW_TEXT = """
ABOUT US

The Geostrata is an independent, youth-led policy and research think tank that advances a distinctly Indian perspective on global affairs. It engages with domestic and international policy, strategic affairs, high-technology, cyber studies, public affairs, sustainability, and Environmental, Social, and Governance (ESG) issues.

1. Core Identity
-A youth-driven policy and research platform
-Promotes layered intellectual discourse and shared wisdom
-Engages with global and domestic strategic developments

2. Team Composition
-200-member team from diverse socio-economic backgrounds across India
-Members from institutions including the University of Delhi, IIMs, IITs, NLUs, Ashoka University, the University of Glasgow, and the   University of Alberta
-Interdisciplinary collaboration across research, content, design, and outreach

3. Strategic Engagements
-Served as Secretariat Partner of Women 20 (W20) under India’s G20 Presidency
-Provided research, knowledge, content, design, and logistical support
-Expanding presence across the United States, the United Kingdom, Europe, and Africa

4. Action-Oriented Initiatives
-Collaboration with Mercedes-Benz beVisioneers fellowship on the ‘SuryaGanga’ project
-Installation of solar panels in Indian schools
-Monthly reach of approximately one million people through publications, social media, and deliberation sessions
-Capacity-building workshops in writing, design, and policy brief formulation

5. Social Arm
-The Geostrata Foundation
-Guided by 25 Rising Gen Goals
-Planted 500 trees across Africa on 5 June 2023 (World Environment Day)




CONFERENCES AND SUMMITS ORGANISED

The Geostrata organizes and facilitates international conferences and summits focused on global security, strategic affairs, sustainability, and youth engagement.

1. BRICS Youth Energy Summit
-Spearheaded in South Africa
-Conducted in partnership with the BRICS Youth Energy Agency
-Supported by the Government of South Africa
-Focused on youth participation in energy transitions and sustainable development

2. NATO–India Youth Conference
-Inaugural edition held at the Residence of the Ambassador of the Netherlands in New Delhi
-Brought together young leaders and security experts
-Focused on global security and the Indo-Pacific region
Key Discussion Themes:
-Youth Championing Peace and Security
-India–NATO diplomatic engagement
-Maritime security and climate challenges in the Indo-Pacific
-Strategic culture and political cohesion
-NATO partnerships in the Indo-Pacific
-Counterterrorism and cybersecurity

3. Global South and COP28 Panel
-Facilitated India’s first offline panel discussion on the Global South’s pathway to COP28
-Participation from representatives of the World Bank, UN-Habitat, WWF, and UNEP
-Focused on sustainability, regional cooperation, and global governance

ABOUT US

The Geostrata is an independent, youth-led policy and research think tank that advances a distinctly Indian perspective on global affairs. It engages with domestic and international policy, strategic affairs, high-technology, cyber studies, public affairs, sustainability, and Environmental, Social, and Governance (ESG) issues.

1. Core Identity
-A youth-driven policy and research platform
-Promotes layered intellectual discourse and shared wisdom
-Engages with global and domestic strategic developments

2. Team Composition
-200-member team from diverse socio-economic backgrounds across India
-Members from institutions including the University of Delhi, IIMs, IITs, NLUs, Ashoka University, the University of Glasgow, and the   University of Alberta
-Interdisciplinary collaboration across research, content, design, and outreach

3. Strategic Engagements
-Served as Secretariat Partner of Women 20 (W20) under India’s G20 Presidency
-Provided research, knowledge, content, design, and logistical support
-Expanding presence across the United States, the United Kingdom, Europe, and Africa

4. Action-Oriented Initiatives
-Collaboration with Mercedes-Benz beVisioneers fellowship on the ‘SuryaGanga’ project
-Installation of solar panels in Indian schools
-Monthly reach of approximately one million people through publications, social media, and deliberation sessions
-Capacity-building workshops in writing, design, and policy brief formulation

5. Social Arm
-The Geostrata Foundation
-Guided by 25 Rising Gen Goals
-Planted 500 trees across Africa on 5 June 2023 (World Environment Day)







STRATA PARTNERSHIPS

The Geostrata maintains institutional collaborations and strategic partnerships with over 100 organisations across more than 50 countries. Its partnerships span think tanks, universities, diplomatic missions, multilateral platforms, and policy institutions.

1. Organisations with Signed Memorandum of Understanding (MoU)
-Centro Studi Internazionali
-Mondo Internazionale
-CUTS International
-Konrad-Adenauer-Stiftung (KAS)
-Global Weekly
-INSA Warwick
-O.P. Jindal Global University
-BRICS Youth Energy Association (BRICS YEA)
-Carnegie Council for Ethics in International Affairs
-Young Security Conference (YSC)
-Australian Institute of International Affairs (AIIA)
-Europinion
-Bloomsbury Intelligence and Security Institute
-Quantum Ecosystems and Technology Council of India
-Young European Leadership
-Organisation for Research on China and Asia (ORCA)
-IQuilibrium

2. Institutional Collaborations without MoU
-NATO
-Australia India Youth Dialogue (AIYD)
-Ministry of External Affairs, Government of India
-Embassy of the Netherlands
-U.S. Consulate Hyderabad
-Italian Consulate Bangalore
-Embassy of Mexico
-Embassy of Germany
-Embassy of Switzerland
-Embassy of Latvia
-Embassy of Czech Republic
-Embassy of Lithuania
-Embassy of Poland
-British Deputy High Commission Mumbai
-British Deputy High Commission Chandigarh
-High Commission of the Republic of Singapore
-Russian Embassy
-Indian Tourism Development Council (ITDC)
-Ministry of Tourism, Government of India

3. Key Collaborative Events
-NATO–India Youth Conference 2025 — with NATO, Konrad-Adenauer-Stiftung (KAS), and the Embassy of the Kingdom of the Netherlands
-Indo-Pacific and QUAD Dialogue — with the American Center, Embassy of the United States of America
-Dialogue on AI in Industry and Beyond — with the American Center, Embassy of the United States of America
-Panel on Nuclear Policy and the Ethics of Decision Making (Global Ethics Day 2025) — with Carnegie Council for Ethics in International Affairs
-Electoral Awareness Panel and Report on Procedural Reforms in Elections in India — hosted during the 2024 Indian General Elections
-Rising Leaders for Inclusive & Progressive Change Programme — with Konrad-Adenauer-Stiftung (KAS) and ILEAD Global Foundation
-Delhi Debates (Inaugural Edition) — with Office of Career Services, O.P. Jindal Global University
-India–ASEAN Youth Conference (Second Edition) — with Foreign Policy Talks
-Roundtable on Indian Foreign Policy and Youth Engagement — with Ministry of External Affairs, Government of India
-Panel on Latin American Studies — with King’s College London
-Panel on The West’s Collective Role in the International Order — with King’s College London
-National Technology Day Symposium 2024 — recognised as Official Youth Policy Partner, with PHD Chamber of Commerce and Industry and Indian Youth Nuclear Society
-India–Germany Bilateral Partnership Roundtable (Second Edition) — with Konrad-Adenauer-Stiftung (KAS)
-Panel on India–Australia Youth Engagement and Bilateral Relations — with Australian Institute of International Affairs (AIIA)
-High-level dialogue with the Hon. Tony Abbott, Former Prime Minister of Australia

4. High-Level Interviews Conducted
-The Geostrata has conducted interviews and dialogues with senior diplomats, policymakers, and strategic experts, including:
-H.E. Ms. Jennifer Larson — Former Consul General of the United States (Bengaluru)
-Ms. Andrea Wechsler — Member of the European Parliament (CDU), Germany
-Mr. Jürgen Hardt — Member of the Bundestag, Germany
-The Rt. Hon. Andrew Mitchell MP — Deputy Foreign Secretary, United Kingdom
-The Hon. Tony Abbott — Former Prime Minister of Australia
-H.E. Mr. Martin Maier — Consul General of Switzerland to India
-Mr. Luke Gosling MP — Member of the House of Representatives, Australia
-Mr. Paul Fletcher MP — Member of Parliament, Australia
-Dr. Adrian Haack — Director (India), Konrad-Adenauer-Stiftung
-Lt. Gen. (Retd.) P. R. Shankar — Former Lieutenant General, Indian Army
-Amb. Vijay Gokhale (Retd.) — Former Foreign Secretary of India
-Mr. Shyam Saran — Former Foreign Secretary of India
-Mr. Shivshankar Menon — Former National Security Adviser and Foreign Secretary of India
-Prof. Dr. Harsh V. Pant — Vice President for Studies and Foreign Policy, Observer Research Foundation; Professor of International Relations, King’s College London






CONFERENCES AND SUMMITS ORGANISED

The Geostrata organizes and facilitates international conferences and summits focused on global security, strategic affairs, sustainability, and youth engagement.

1. BRICS Youth Energy Summit
-Spearheaded in South Africa
-Conducted in partnership with the BRICS Youth Energy Agency
-Supported by the Government of South Africa
-Focused on youth participation in energy transitions and sustainable development

2. NATO–India Youth Conference
-Inaugural edition held at the Residence of the Ambassador of the Netherlands in New Delhi
-Brought together young leaders and security experts
-Focused on global security and the Indo-Pacific region
Key Discussion Themes:
-Youth Championing Peace and Security
-India–NATO diplomatic engagement
-Maritime security and climate challenges in the Indo-Pacific
-Strategic culture and political cohesion
-NATO partnerships in the Indo-Pacific
-Counterterrorism and cybersecurity

3. Global South and COP28 Panel
-Facilitated India’s first offline panel discussion on the Global South’s pathway to COP28
-Participation from representatives of the World Bank, UN-Habitat, WWF, and UNEP
-Focused on sustainability, regional cooperation, and global governance

# Sub-Organizations

1. Main Organisation
   
-The Geostrata Foundation
-The official and social impact arm of the organisation. It focuses on policy awareness, educational initiatives, youth engagement, and outreach programs.

2. Specialized Content Verticals

These verticals focus on domain-specific research and content creation:

-Covering MEA
  Covers India’s foreign policy, diplomacy, and international relations.

-Covering China 
  Focuses on China’s politics, economy, military strategy, and global influence.

-Covering PMO
  Covers public policy, governance models, and government initiatives.

-Covering ISRO 
  Focuses on India’s space missions, technological developments, and global space competition.

-Graphics of Strata
  Responsible for visual storytelling including infographics, data visualization, and design content.

# Organisational Structure

1. Leadership

-Led by the Founder/President along with Directors
-Responsible for strategic planning, vision setting, and overall management

2. Core Departments

-Each department handles a key functional area:

-Research & Policy
  Conducts in-depth research, policy analysis, and prepares reports

-Content & Editorial
  Responsible for articles, blogs, reports, and editorial quality

-Design & Media
  Handles graphics, videos, branding, and visual communication

-Outreach & Partnerships
  Manages collaborations, events, and external relations

-Operations
  Oversees internal coordination, workflow, and administration

3. Specialized Verticals

-Covering MEA
-Covering China
-Covering PMO & Governance
-Covering ISRO

These verticals work across departments but focus on specific subject areas.

4. Platforms

-Geopost– Publishes research articles, blogs, and opinion pieces
-Geomaga – Digital magazine featuring curated, long-form content


5. Associated Organisations

-The Geostrata Foundation – Social and outreach division

6. Hierarchy

-A clear growth structure is followed:

-Intern → Associate → Analyst → Team Lead → Director**

-Intern – Entry-level role for learning and contribution
-Associate – Works on tasks with guidance
-Analyst – Handles independent work and research
-Team Lead – Manages teams and projects
-Director – Leads departments and strategy

# How to Join Us

1. Check Openings

-Visit the official website or LinkedIn page
-Look for internship, volunteer, or contributor roles

2. Choose Your Domain

-Select a field based on your interest and skills:

-Research & Policy
-Content Writing
-Design & Media
-Outreach / Operations

3. Fill the Application Form

-Provide personal details
-Upload your CV/Resume
-Mention your preferred role and domain

4. Selection Process

-Initial application screening
-Shortlisted candidates may be given:

  -A test assignment
  -An interview

5. Onboarding

-Selected candidates are assigned to teams
-Work on real-time projects
-Receive mentorship and structured guidance


"""

if __name__ == "__main__":
    print(f"🚀 Ingesting: {DOCUMENT_TITLE}...")
    
    metadata = {
        "title": DOCUMENT_TITLE,
        "url": DOCUMENT_URL,
        "type": DOCUMENT_TYPE
    }
    
    process_and_upload(RAW_TEXT, metadata)
    print("\n🎉 SUCCESS: Your offline document is now locked into the AI's memory!")
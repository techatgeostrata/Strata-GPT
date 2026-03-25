import os
from PyPDF2 import PdfReader
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from your Next.js .env.local file
load_dotenv('.env.local')

# Initialize OpenAI and Supabase
openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Note: Use your Service Role Key if your Anon key doesn't have insert permissions
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") 
supabase: Client = create_client(supabase_url, supabase_key)

PDF_PATH = "/Users/danishmir/Downloads/The Geostrata - Intro Deck.pdf"

def process_pdf():
    print(f"📄 Reading PDF: {PDF_PATH}")
    reader = PdfReader(PDF_PATH)
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        
        # Clean up the text and skip empty pages
        text = text.strip() if text else ""
        if len(text) < 50:
            continue
            
        print(f"🧠 Generating embedding for Slide {i + 1}...")
        
        # 1. Generate the embedding for the page
        response = openai.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        embedding = response.data[0].embedding
        
        # 2. Prepare the metadata
        metadata = {
            "title": f"The Geostrata Intro Deck - Slide {i + 1}",
            "type": "official_document",
            "url": "internal_pdf"
        }
        
        # 3. Upload to Supabase
        data, count = supabase.table('documents').insert({
            "content": text,
            "metadata": metadata,
            "embedding": embedding
        }).execute()
        
        print(f"✅ Slide {i + 1} successfully uploaded to Supabase!")

    print("🎉 All PDF data has been ingested into the Strata Intelligence Engine.")

if __name__ == "__main__":
    process_pdf()
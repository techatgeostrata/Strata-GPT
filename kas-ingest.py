import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv('.env.local')

openai = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

content = """Title: The Geostrata x KAS Partnership — Konrad-Adenauer-Stiftung
Type: Partnership
URL: https://www.thegeostrata.com

The Geostrata maintains an ongoing collaboration with Konrad-Adenauer-Stiftung India Office (KAS), a German political foundation operating across more than 120 countries. KAS promotes democracy, the rule of law, political participation, international cooperation, and informed public dialogue. In India, KAS focuses on foreign and security policy, economic and energy policy, rule of law, political dialogue, and youth engagement.

A cornerstone of this partnership is the NATO – India Youth Conference, a flagship initiative bringing together young leaders, policymakers, scholars, and practitioners to engage with questions surrounding security, geopolitics, technology, and international cooperation between India and NATO member states."""

try:
    embedding_response = openai.embeddings.create(
        model='text-embedding-3-small',
        input=content
    )

    embedding = embedding_response.data[0].embedding

    response = supabase.table('documents').insert({
        'content': content,
        'embedding': embedding,
        'metadata': {
            'title': 'The Geostrata x KAS Partnership',
            'type': 'Partnership',
            'url': 'https://www.thegeostrata.com'
        }
    }).execute()

    print('Inserted successfully:', response)

except Exception as e:
    print('Error:', e)
"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#040A15] text-slate-200 font-sans selection:bg-[#004AAD]/50">

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 sm:py-4 bg-[#040A15]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src="/logo.png" alt="The Geostrata Logo" className="h-7 sm:h-9 w-auto object-contain" />
          <div className="h-6 w-px bg-white/15" />
          <div>
            <h1 className="text-[12px] sm:text-[14px] font-bold tracking-widest text-white uppercase leading-none mb-0.5">STRATA GPT</h1>
            <p className="text-[9px] sm:text-[10px] text-[#4D8BFF] font-semibold tracking-wider uppercase leading-none">Intelligence Engine</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Title block */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#004AAD]/20 border border-[#004AAD]/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#4D8BFF]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Privacy Policy</h2>
            <p className="text-sm text-slate-500 mt-0.5">The Geostrata Foundation · Effective: June 9, 2025 · Last Updated: June 9, 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-[15px] leading-[1.8] text-slate-300">

          <Section title="1. Introduction">
            The Geostrata Foundation ("we", "our", or "us") operates STRATA GPT, an AI-powered intelligence platform accessible at stratagpt.thegeostrata.com. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.
            <br /><br />
            By using STRATA GPT, you agree to the terms of this Privacy Policy.
          </Section>

          <Section title="2. Information We Collect">
            <SubHeading>a) Information you provide directly:</SubHeading>
            <BulletList items={[
              'Full name',
              'Email address',
              'Phone number (if provided)',
              'Any other information you voluntarily submit',
            ]} />
            <SubHeading>b) Information collected automatically:</SubHeading>
            <BulletList items={[
              'Chat messages and conversation logs',
              'IP address',
              'Browser type and device information',
              'Usage data and interaction patterns within the platform',
            ]} />
            <SubHeading>c) Information collected via Google Sign-In:</SubHeading>
            Name and email address as shared by your Google account upon authentication.
          </Section>

          <Section title="3. How We Use Your Information">
            <BulletList items={[
              'To provide, operate, and maintain STRATA GPT',
              'To authenticate your identity via Google OAuth',
              'To store and retrieve your conversation history',
              'To improve the quality and relevance of AI responses',
              'To monitor platform usage and prevent abuse',
              'To respond to support queries or technical issues',
              'To comply with applicable legal obligations',
            ]} />
          </Section>

          <Section title="4. Third-Party Services">
            To operate STRATA GPT, we share data with the following third-party service providers. Each provider has their own privacy policy governing their use of data. We do not sell your personal data to any third party.
            <div className="mt-4 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0B1221] border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Service</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Purpose</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold hidden sm:table-cell">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ['OpenAI', 'AI response generation', 'openai.com/privacy', 'https://openai.com/privacy'],
                    ['Supabase', 'Database and authentication', 'supabase.com/privacy', 'https://supabase.com/privacy'],
                    ['Upstash', 'Rate limiting and caching', 'upstash.com/privacy', 'https://upstash.com/privacy'],
                    ['Tavily', 'Real-time web search', 'tavily.com/privacy', 'https://tavily.com/privacy'],
                    ['Google OAuth', 'User authentication', 'policies.google.com/privacy', 'https://policies.google.com/privacy'],
                    ['Netlify', 'Platform hosting', 'netlify.com/privacy', 'https://netlify.com/privacy'],
                  ].map(([service, purpose, label, href]) => (
                    <tr key={service} className="bg-[#070e1a] hover:bg-[#0B1221] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{service}</td>
                      <td className="px-4 py-3 text-slate-400">{purpose}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4D8BFF] hover:underline">{label}</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="5. Data Storage and Security">
            <BulletList items={[
              'Your data is stored securely on Supabase servers.',
              'Conversation logs are stored and associated with your account for chat history retrieval.',
              'We implement reasonable technical and organisational measures to protect your data against unauthorised access, loss, or misuse.',
              'No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
            ]} />
          </Section>

          <Section title="6. Data Retention">
            We retain your personal data for as long as your account is active or as necessary to provide our services. You may request deletion of your data at any time by contacting us at the email address below.
          </Section>

          <Section title="7. Your Rights">
            Under applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDPA), you have the right to:
            <BulletList items={[
              'Access the personal data we hold about you',
              'Correct inaccurate or incomplete data',
              'Request erasure of your personal data',
              'Withdraw consent at any time',
              'Nominate a representative to exercise your rights on your behalf',
            ]} />
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:techatgeostrata@gmail.com" className="text-[#4D8BFF] hover:underline">techatgeostrata@gmail.com</a>.
          </Section>

          <Section title="8. Children's Privacy">
            STRATA GPT is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children. If we become aware that a child has provided us with personal information, we will delete it promptly.
          </Section>

          <Section title="9. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last Updated" date at the top of this page. Continued use of the platform after changes constitutes acceptance of the updated policy.
          </Section>

          <Section title="10. Contact Us">
            <div className="bg-[#0B1221] border border-slate-800 rounded-xl px-5 py-4 space-y-1">
              <p className="text-white font-semibold">The Geostrata Foundation</p>
              <p>Email: <a href="mailto:techatgeostrata@gmail.com" className="text-[#4D8BFF] hover:underline">techatgeostrata@gmail.com</a></p>
              <p>Website: <a href="https://thegeostrata.com" target="_blank" rel="noopener noreferrer" className="text-[#4D8BFF] hover:underline">thegeostrata.com</a></p>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-4 sm:px-6 py-6 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} The Geostrata Foundation. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/privacy-policy" className="text-[#4D8BFF]">Privacy Policy</a>
            <span className="text-slate-700">·</span>
            <a href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/[0.06] pt-8">
      <h3 className="text-[17px] sm:text-[18px] font-semibold text-white mb-3">{title}</h3>
      <div className="text-slate-400">{children}</div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 font-medium mt-4 mb-1.5">{children}</p>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-2 w-1 h-1 rounded-full bg-[#4D8BFF] flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
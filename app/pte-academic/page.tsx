import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, BookOpen, Headphones, PenTool, Eye, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'PTE Academic | Vertex Testing Services Limited',
  description: 'Achieve your global education goals with PTE Academic. Professional registration assistance, expert preparation classes, and realistic mock tests.',
}

export default function PTEAcademicPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Achieve Your Global Education Goals with PTE Academic
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Recognized by universities, colleges, governments, and organizations worldwide
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              PTE Academic is a computer-based English language proficiency test designed to assess the speaking, writing, reading, and listening skills of non-native English speakers. At Vertex Testing Services Limited, we provide professional registration assistance, expert preparation classes, and realistic mock tests to help you prepare with confidence.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Register Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is PTE Academic */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">What is PTE Academic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                PTE Academic is a fully computer-based English language test that evaluates your ability to communicate effectively in everyday academic and professional settings.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The test uses AI-assisted scoring technology and is designed to provide a fair, objective, and secure assessment of your English language skills.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Fully computerized testing experience</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">AI-assisted scoring technology</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Fair and objective assessment</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Secure and reliable results</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 bg-card border border-border rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-32 h-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Take It */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Who Should Take PTE Academic?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AudienceCard description="Students applying to universities and colleges abroad" />
            <AudienceCard description="Individuals seeking admission to international educational institutions" />
            <AudienceCard description="Professionals who need to demonstrate English proficiency" />
            <AudienceCard description="Candidates applying for opportunities where PTE Academic is accepted" />
          </div>
        </div>
      </section>

      {/* Test Format */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Test Format</h2>
          <p className="text-lg text-muted-foreground mb-12">
            The exam assesses four key communication skills:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SkillCard
              icon={PenTool}
              title="Speaking & Writing"
              description="Demonstrate your ability to communicate clearly and effectively in spoken and written English."
            />
            <SkillCard
              icon={Eye}
              title="Reading"
              description="Measure your understanding of written English through a variety of question types and passages."
            />
            <SkillCard
              icon={Headphones}
              title="Listening"
              description="Evaluate your ability to understand spoken English in different academic and everyday contexts."
            />
            <SkillCard
              icon={BookOpen}
              title="Comprehensive Assessment"
              description="Each section is carefully designed to assess real-world communication skills effectively."
            />
          </div>
        </div>
      </section>

      {/* Why Prepare with Vertex */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Why Prepare with Vertex?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
            Our preparation programmes are designed to help candidates become familiar with the exam format while building confidence and improving performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitItem text="Experienced instructors" />
            <BenefitItem text="Structured learning materials" />
            <BenefitItem text="Computer-based practice sessions" />
            <BenefitItem text="Speaking practice" />
            <BenefitItem text="Writing guidance" />
            <BenefitItem text="Realistic mock tests" />
            <BenefitItem text="Individual performance feedback" />
            <BenefitItem text="Professional guidance" />
            <BenefitItem text="Flexible scheduling" />
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Our PTE Academic Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ServiceItem title="Professional registration assistance" />
            <ServiceItem title="Physical preparation classes" />
            <ServiceItem title="Online preparation classes" />
            <ServiceItem title="Weekend coaching" />
            <ServiceItem title="Intensive preparation programmes" />
            <ServiceItem title="Computer-based mock tests" />
            <ServiceItem title="Candidate support" />
            <ServiceItem title="Performance feedback" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="How is PTE Academic delivered?"
              answer="PTE Academic is delivered entirely on a computer. The test is fully computerized, and candidates interact with the exam through a computer interface in a secure testing environment."
            />
            <FAQItem
              question="Which skills are assessed?"
              answer="The exam assesses Speaking, Writing, Reading, and Listening. Each section evaluates different aspects of English language proficiency in real-world scenarios."
            />
            <FAQItem
              question="Can I prepare before taking the exam?"
              answer="Yes. Proper preparation helps candidates become familiar with the test format and improve their confidence before the exam. We highly recommend taking preparation classes or mock tests."
            />
            <FAQItem
              question="Does Vertex provide preparation classes?"
              answer="Yes. We offer both physical and online preparation programmes, as well as computer-based mock tests. We also provide weekend coaching and intensive preparation options."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Register for PTE Academic?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Begin your PTE Academic journey with Vertex Testing Services Limited and prepare with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition"
            >
              Register Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/preparation"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-primary-foreground text-primary-foreground font-medium hover:bg-primary-foreground/10 transition"
            >
              View Preparation Options
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function AudienceCard({ description }: { description: string }) {
  return (
    <div className="p-6 rounded-lg bg-background border border-border hover:border-primary/50 transition flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function SkillCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="p-8 rounded-lg bg-card border border-border hover:border-primary/50 transition">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border">
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

function ServiceItem({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 p-6 rounded-lg bg-background border border-border hover:border-primary/50 transition">
      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function FAQItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <div className="p-6 rounded-lg bg-background border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-3">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}

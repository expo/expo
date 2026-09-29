import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, Globe, Users, BookOpen, Headphones, ArrowRight, PenTool } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'PTE Core | Vertex Testing Services Limited',
  description: 'Your pathway to Canadian immigration. Professional PTE Core registration, expert preparation, and realistic mock tests.',
}

export default function PTECorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your Pathway to Canadian Immigration Starts Here
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              PTE Core - English language proficiency for eligible Canadian immigration pathways
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              PTE Core is an English language proficiency test designed to assess the everyday English communication skills of individuals applying for Canadian immigration and other eligible programs. At Vertex Testing Services Limited, we provide professional registration assistance, expert preparation classes, and realistic mock tests to help you prepare confidently.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Register for PTE Core
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is PTE Core */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">What is PTE Core?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                PTE Core is a computer-based English language test that measures your ability to communicate effectively in real-life situations. The examination evaluates four essential English language skills.
              </p>
              <div className="space-y-3">
                <SkillListItem skill="Speaking" />
                <SkillListItem skill="Writing" />
                <SkillListItem skill="Reading" />
                <SkillListItem skill="Listening" />
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                PTE Core is designed specifically for Canadian immigration purposes and measures everyday English communication skills.
              </p>
            </div>
            <div className="relative h-96 bg-card border border-border rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-32 h-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Take It */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Who Should Take PTE Core?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AudienceCard description="Individuals planning to immigrate to Canada through eligible immigration pathways" />
            <AudienceCard description="Skilled professionals seeking Canadian employment opportunities" />
            <AudienceCard description="Workers looking for employment prospects in Canada" />
            <AudienceCard description="Applicants requiring an accepted English language proficiency test for Canadian immigration programs" />
          </div>
        </div>
      </section>

      {/* Test Format */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Test Format</h2>
          <p className="text-lg text-muted-foreground mb-12">
            The examination is fully computer-based and evaluates:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormatCard
              icon={PenTool}
              title="Speaking"
              description="Assess your ability to communicate confidently and naturally in spoken English."
            />
            <FormatCard
              icon={BookOpen}
              title="Writing"
              description="Measure your ability to express ideas clearly, accurately, and effectively."
            />
            <FormatCard
              icon={Users}
              title="Reading"
              description="Evaluate your understanding and interpretation of written English."
            />
            <FormatCard
              icon={Headphones}
              title="Listening"
              description="Assess your ability to understand spoken English in everyday situations."
            />
          </div>
        </div>
      </section>

      {/* Why Prepare with Vertex */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Why Prepare with Vertex?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Success begins with proper preparation. Our preparation programme includes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PrepItem text="Comprehensive classroom training" />
            <PrepItem text="Online learning options" />
            <PrepItem text="Computer-based practice sessions" />
            <PrepItem text="Realistic mock examinations" />
            <PrepItem text="Individual coaching" />
            <PrepItem text="Performance reviews" />
            <PrepItem text="Expert guidance from experienced instructors" />
            <PrepItem text="Flexible learning schedules" />
            <PrepItem text="Dedicated candidate support" />
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Our PTE Core Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ServiceItem title="Professional registration assistance" />
            <ServiceItem title="PTE Core preparation classes" />
            <ServiceItem title="Weekend coaching" />
            <ServiceItem title="Intensive preparation programmes" />
            <ServiceItem title="Online classes" />
            <ServiceItem title="Computer-based mock tests" />
            <ServiceItem title="Dedicated candidate support" />
            <ServiceItem title="Performance feedback and guidance" />
          </div>
        </div>
      </section>

      {/* Why Choose Vertex */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Why Choose Vertex Testing Services Limited?</h2>
          <div className="space-y-6">
            <WhyChooseItem
              title="Professional Support"
              description="Friendly guidance throughout your registration and preparation journey."
            />
            <WhyChooseItem
              title="Modern Learning Environment"
              description="A comfortable and professional atmosphere designed for effective learning."
            />
            <WhyChooseItem
              title="Experienced Trainers"
              description="Dedicated instructors committed to helping candidates achieve their target scores."
            />
            <WhyChooseItem
              title="Flexible Learning Options"
              description="Choose from physical classes, online classes, weekend programmes, or intensive coaching."
            />
            <WhyChooseItem
              title="Realistic Mock Tests"
              description="Experience exam-like practice sessions that build confidence before test day."
            />
            <WhyChooseItem
              title="Excellent Customer Care"
              description="We are committed to delivering outstanding service and support to every candidate."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="What is PTE Core?"
              answer="PTE Core is a computer-based English language proficiency test designed for eligible Canadian immigration purposes."
            />
            <FAQItem
              question="Which skills are tested?"
              answer="The examination assesses Speaking, Writing, Reading, and Listening in real-world everyday contexts."
            />
            <FAQItem
              question="Can I prepare before taking the examination?"
              answer="Yes. Proper preparation helps candidates understand the test format, improve their English language skills, and build confidence before the examination."
            />
            <FAQItem
              question="Does Vertex offer preparation classes?"
              answer="Yes. We provide physical classes, online training, intensive coaching programmes, and realistic computer-based mock tests."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Begin Your PTE Core Journey Today</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Whether you are planning your next step toward Canada or preparing to improve your English proficiency, Vertex Testing Services Limited is ready to support you every step of the way.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition"
          >
            Register Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function SkillListItem({ skill }: { skill: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <span className="text-muted-foreground">{skill}</span>
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

function FormatCard({
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

function PrepItem({ text }: { text: string }) {
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

function WhyChooseItem({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg bg-background border border-border hover:border-primary/50 transition">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
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
    <div className="p-6 rounded-lg bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-3">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}

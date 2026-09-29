import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, Monitor, TrendingUp, Users, Clock, BookOpen, ArrowRight, Target } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'PTE Mock Tests | Vertex Testing Services Limited',
  description: 'Experience realistic computer-based mock exams with detailed performance feedback. Build confidence before your PTE examination.',
}

export default function MockTestsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              PREPARE WITH CONFIDENCE. TEST WITH PURPOSE.
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Get familiar with the examination experience before the big day.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Our realistic computer-based practice tests help candidates understand exam formats, build confidence, manage time effectively, and identify areas for improvement before test day. PRACTICE • PREPARE • PERFORM. Your Gateway to Global Success.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Book a Mock Test
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What is Mock Test */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">WHAT IS AN EXAM MOCK TEST?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
An Exam Mock Test is a practice examination designed to simulate the structure, timing, and testing conditions of an actual examination.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    It helps candidates become familiar with the examination experience, evaluate their readiness, identify areas for improvement, and build confidence before test day.
                  </p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Realistic exam simulation</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Timed testing experience</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Performance assessment</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Identify strengths and areas for improvement</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Build confidence before test day</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 bg-card border border-border rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Monitor className="w-32 h-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Take Mock Test */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Why Take a Mock Test?</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Taking a mock test offers several important benefits:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitCard
              icon={BookOpen}
              title="Become Familiar with the Format"
              description="Get comfortable with the exam structure, question types, and interface before your official test."
            />
            <BenefitCard
              icon={TrendingUp}
              title="Build Confidence"
              description="Gain experience in a realistic exam environment and reduce test day anxiety."
            />
            <BenefitCard
              icon={Clock}
              title="Improve Time Management"
              description="Learn to allocate your time effectively across all sections of the exam."
            />
            <BenefitCard
              icon={Target}
              title="Identify Weak Areas"
              description="Discover sections requiring improvement and focus your preparation accordingly."
            />
            <BenefitCard
              icon={Users}
              title="Reduce Examination Anxiety"
              description="Familiarize yourself with exam conditions to feel more prepared and confident."
            />
            <BenefitCard
              icon={CheckCircle2}
              title="Develop Test-Taking Strategies"
              description="Learn effective strategies that work best for different question types."
            />
          </div>
        </div>
      </section>

      {/* Mock Test Features */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Our Mock Test Features</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Our comprehensive mock testing service includes:
          </p>
          <div className="space-y-4">
            <FeatureItem
              title="Computer-Based Examination Environment"
              description="Practice in our modern computer lab with equipment identical to official test centers."
            />
            <FeatureItem
title="FULL-LENGTH PRACTICE EXAMINATION"
  description="Complete mock examinations designed to cover the key sections and question formats of internationally recognized examinations, helping candidates assess their readiness and build confidence before test day."
            />
            <FeatureItem
              title="Exam-Like Conditions"
              description="Timed sections, realistic breaks, and professional testing environment."
            />
            <FeatureItem
              title="Detailed Performance Report"
              description="Comprehensive scoring breakdown showing your performance in each section."
            />
            <FeatureItem
              title="Section-by-Section Analysis"
              description="Detailed analysis of your strengths and areas needing improvement in each skill area."
            />
            <FeatureItem
              title="Speaking and Writing Evaluation"
              description="Professional evaluation of your spoken and written responses with constructive feedback."
            />
            <FeatureItem
              title="Personalized Feedback"
              description="Individual guidance from experienced trainers on how to improve your score."
            />
            <FeatureItem
              title="Professional Guidance for Improvement"
              description="Actionable recommendations and strategies to help you achieve your target score."
            />
          </div>
        </div>
      </section>

      {/* Who Should Take */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">WHO SHOULD TAKE OUR MOCK TESTS?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<AudienceCard description="First-time candidates who want to understand the examination format" />
  <AudienceCard description="Candidates preparing for international examinations such as IELTS, PTE, TOEFL, GRE, GMAT, CELPIP and more" />
  <AudienceCard description="Candidates who want to assess their readiness before the official examination" />
  <AudienceCard description="Candidates seeking to improve their performance on their next attempt" />
  <AudienceCard description="Candidates who want to practise under realistic examination conditions" />
  <AudienceCard description="Candidates who want to identify strengths, weaknesses and areas for improvement" />
          </div>
        </div>
      </section>

      {/* Why Choose Vertex Mock Tests */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">WHY CHOOSE VERTEX MOCK TESTS?</h2>
          <div className="space-y-6">
            <WhyChooseItem
title="REALISTIC EXAMINATION EXPERIENCE"
  description="Practice under structured, timed conditions designed to help you become comfortable with computer-based examinations."
            />
            <WhyChooseItem
title="PERFORMANCE INSIGHTS"
  description="Understand your current level, identify areas for improvement, and prepare more effectively for your examination."
            />
            <WhyChooseItem
title="PROFESSIONAL TESTING ENVIRONMENT"
  description="Experience mock examinations in a comfortable, organized, and well-equipped computer-based environment."
            />
            <WhyChooseItem
              title="Modern Computer Facilities"
              description="Practice in a comfortable and well-equipped computer-based learning environment."
            />
            <WhyChooseItem
title="READINESS ASSESSMENT"
  description="Measure your level of preparedness and identify areas requiring additional attention before your official examination."
            />
            <WhyChooseItem
title="MULTIPLE EXAM OPTIONS"
  description="Access mock testing support for a range of international examinations, including IELTS, PTE, TOEFL, GRE, GMAT, CELPIP and more."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <FAQItem
              question="How long does the mock test take?"
              answer="The mock test follows a structure similar to the official examination, typically taking 3-4 hours including all sections and realistic breaks."
            />
            <FAQItem
              question="Will I receive feedback after the mock test?"
              answer="Yes. Every candidate receives a detailed performance report and professional feedback from our instructors."
            />
            <FAQItem
              question="Can I take more than one mock test?"
              answer="Yes. Many candidates take multiple mock tests to monitor their progress and improve their performance over time."
            />
            <FAQItem
              question="Do I need to complete preparation classes before taking a mock test?"
              answer="No. Mock tests are available to all candidates, regardless of whether they have attended our preparation classes."
            />
            <FAQItem
              question="How soon can I take a mock test after registering?"
              answer="Mock tests can typically be scheduled within a few days of your booking. Contact our team for available dates and times."
            />
            <FAQItem
question="WILL MY MOCK TEST SCORE BE THE SAME AS MY OFFICIAL EXAM SCORE?"
  answer="Mock test results are designed to help you assess your current level of preparation and identify areas for improvement. Your official examination score may differ due to examination format, scoring systems, performance, and test-day conditions."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Book Your Mock Test Today</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Take the next step toward achieving your target score. Experience a realistic examination environment and prepare with confidence.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition"
          >
            Book Your Mock Test Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="p-8 rounded-lg bg-background border border-border hover:border-primary/50 transition">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function FeatureItem({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg bg-background border border-border hover:border-primary/50 transition flex gap-4">
      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
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
    <div className="p-6 rounded-lg bg-background border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-3">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}

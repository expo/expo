import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckCircle2, Laptop, Users, BookMarked, Zap, ArrowRight, Award } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'PTE Preparation Classes | Vertex Testing Services Limited',
  description: 'Master the PTE with confidence. Physical, online, weekend, and intensive preparation classes designed to help you achieve your target score.',
}

export default function PreparationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              MASTER YOUR EXAM WITH CONFIDENCE
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Comprehensive preparation programmes designed to help you succeed.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              At Vertex Testing Services Limited, our examination preparation programmes are designed to equip candidates with the knowledge, strategies, practice, and confidence required to perform at their best. We provide structured preparation support for IELTS, PTE, TOEFL, GRE, GMAT, CELPIP and other leading international examinations. Our goal is simple: Prepare Better. Perform Better. Achieve More.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Enroll Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Training Programmes */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Our Training Programmes</h2>
          <p className="text-lg text-muted-foreground mb-12">
            We offer flexible learning options to suit your schedule and learning preferences.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ProgramCard
              icon={Laptop}
              title="Physical Classroom Training"
              description="Attend instructor-led classes in a comfortable and professional learning environment with direct access to trainers."
            />
            <ProgramCard
              icon={BookMarked}
              title="Online Live Classes"
              description="Learn from anywhere through interactive online sessions with experienced trainers and access to learning materials."
            />
            <ProgramCard
              icon={Users}
              title="One-on-One Coaching"
              description="Receive personalized training tailored to your individual learning needs and specific target score requirements."
            />
            <ProgramCard
              icon={Zap}
              title="Weekend Classes"
              description="Ideal for working professionals and busy students who want quality preparation on their schedule."
            />
            <ProgramCard
              icon={Award}
              title="Intensive Preparation Programme"
              description="Accelerated coaching designed for candidates preparing within a short period before their examination."
            />
            <ProgramCard
              icon={CheckCircle2}
              title="Flexible Scheduling"
              description="Choose the training format that works best for your lifestyle and preparation timeline."
            />
          </div>
        </div>
      </section>

      {/* What You Will Learn */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">What You Will Learn</h2>
          <p className="text-lg text-muted-foreground mb-12">
            Our preparation programme covers every section of the examination comprehensively.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SkillSection
              title="Speaking Skills"
              points={[
                'Pronunciation techniques',
                'Fluency development',
                'Confidence building',
                'Real-world conversation practice',
                'Test-specific speaking strategies',
              ]}
            />
            <SkillSection
              title="Writing Skills"
              points={[
                'Effective writing techniques',
                'Grammar and vocabulary mastery',
                'Time management strategies',
                'Essay and email writing',
                'Professional writing standards',
              ]}
            />
            <SkillSection
              title="Reading Skills"
              points={[
                'Speed reading techniques',
                'Accuracy improvement',
                'Comprehension development',
                'Question type strategies',
                'Effective note-taking',
              ]}
            />
            <SkillSection
              title="Listening Skills"
              points={[
                'Concentration enhancement',
                'Understanding spoken English',
                'Accent familiarization',
                'Note-taking strategies',
                'Test-specific listening tips',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Why Our Preparation Works</h2>
          <div className="space-y-4">
            <FeatureItem
              title="Experienced Instructors"
              description="Our dedicated trainers have extensive expertise and are committed to student success."
            />
            <FeatureItem
              title="Structured Learning Materials"
              description="Carefully curated materials that cover all test sections and question types."
            />
            <FeatureItem
              title="Computer-Based Practice Sessions"
              description="Practice with authentic exam-like simulations to build familiarity and confidence."
            />
              <FeatureItem
              title="Realistic Mock Tests"
              description="Full-length practice exams that replicate actual test conditions."
            />
            <FeatureItem
              title="International Examination Registration Support"
              description="Professional guidance and registration assistance for IELTS, PTE, TOEFL, GRE, GMAT, CELPIP and other recognized examinations."
            />
            <FeatureItem
              title="Individual Performance Feedback"
              description="Detailed analysis of your strengths and areas for improvement after each session."
            />
            <FeatureItem
              title="Flexible Class Schedules"
              description="Evening, weekend, and intensive options to fit your lifestyle."
            />
          </div>
        </div>
      </section>

      {/* Enrollment Process */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Enrollment Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Step number="1" title="Contact Us" description="Reach out to our team for information" />
            <Step number="2" title="Consultation" description="Discuss your goals and choose your program" />
            <Step number="3" title="Registration" description="Complete enrollment and payment" />
            <Step number="4" title="Begin Learning" description="Start your preparation journey" />
          </div>
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              Contact Us for Enrollment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Preparation Today</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join hundreds of successful candidates who have achieved their target scores with Vertex Testing Services Limited.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition"
          >
            Enroll for Preparation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ProgramCard({
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

function SkillSection({
  title,
  points,
}: {
  title: string
  points: string[]
}) {
  return (
    <div className="p-8 rounded-lg bg-background border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
      <ul className="space-y-2">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{point}</span>
          </li>
        ))}
      </ul>
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
    <div className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition">
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center p-6 rounded-lg bg-background border border-border">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3 mx-auto">
        {number}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

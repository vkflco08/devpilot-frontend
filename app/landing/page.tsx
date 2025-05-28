"use client"

import { useState, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useTheme } from "next-themes"
import { 
  LayoutDashboard, 
  BookOpen, 
  ArrowRight, 
  Layout, 
  Eye, 
  Settings 
} from "lucide-react"

export default function LandingPage() {
  const { theme, systemTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const resolved = theme === "system" ? systemTheme : theme
    setIsDark(resolved === "dark")
  }, [theme, systemTheme])

  const features = [
    {
      title: "계층적 작업 구조",
      description: "상위-하위 작업 관계를 통해 복잡한 프로젝트를 체계적으로 분해하고 관리할 수 있습니다.",
      icon: LayoutDashboard,
      benefits: ["프로젝트 구조 시각화", "작업 의존성 관리", "진행 상황 추적"]
    },
    {
      title: "시간 추적 시스템",
      description: "예상 시간과 실제 소요 시간을 비교하여 프로젝트 계획 정확도를 높이세요.",
      icon: BookOpen,
      benefits: ["시간 예측 정확도 향상", "생산성 분석", "프로젝트 일정 최적화"]
    },
    {
      title: "직관적인 대시보드",
      description: "드래그 앤 드롭으로 작업 상태를 변경하고, 필터링을 통해 원하는 작업만 빠르게 확인하세요.",
      icon: LayoutDashboard,
      benefits: ["실시간 상태 업데이트", "유연한 필터링", "사용자 친화적 인터페이스"]
    }
  ];

  return (
    <>
    <Navbar />
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${
        isDark ? "from-gray-900/80 to-gray-800/80" : "from-slate-50 to-blue-50"
      } py-20 px-6`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className={`text-5xl md:text-6xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            } mb-6 leading-tight`}>
              TaskPilot
            </h1>
            <p className={`text-xl md:text-2xl ${
              isDark ? "text-gray-300" : "text-gray-600"
            } mb-8 max-w-3xl mx-auto leading-relaxed`}>
              프로젝트 관리 도구
            </p>
            <p className={`text-lg ${
              isDark ? "text-gray-500" : "text-gray-500"
            } mb-12 max-w-2xl mx-auto`}>
              프로젝트와 작업을 체계적으로 관리하고, 생산성을 극대화하세요. <br />
              계층적 작업 구조와 직관적인 인터페이스로 복잡한 프로젝트도 쉽게 관리할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[
              {
                icon: Layout,
                title: "프로젝트 관리",
                description: "다수의 프로젝트를 생성하고 체계적으로 관리하세요"
              },
              {
                icon: Eye,
                title: "작업 추적",
                description: "TODO, DOING, DONE으로 작업 상태를 시각적으로 관리"
              },
              {
                icon: Settings,
                title: "스마트 기능",
                description: "우선순위, 태그, 시간 추적으로 효율적인 작업 관리"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`text-center p-6 ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                } rounded-xl shadow-sm`}
              >
                <item.icon className={`h-12 w-12 ${
                  isDark ? "text-blue-400" : "text-blue-600"
                } mx-auto mb-4`} />
                <h3 className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                } mb-2`}>
                  {item.title}
                </h3>
                <p className={`text-gray-400 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-6 ${
        isDark ? "bg-gray-900" : "bg-white"
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="space-y-20">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-12`}
              >
                <div className="flex-1">
                  <div className="flex items-center mb-6">
                    <feature.icon className={`h-8 w-8 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    } mr-3`} />
                    <h3 className={`text-3xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } mb-8 leading-relaxed`}>
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, idx) => (
                      <li 
                        key={idx} 
                        className={`flex items-center ${
                          isDark ? "text-gray-400" : "text-gray-700"
                        }`}
                      >
                        <ArrowRight className={`h-4 w-4 ${
                          isDark ? "text-blue-400" : "text-blue-600"
                        } mr-3 flex-shrink-0`} />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 ${
        isDark ? "bg-gray-800" : "bg-gray-100"
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className={`border-t py-8 ${isDark ? "border-gray-800" : "border-gray-200"}`}>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  © 2025 TaskPilot. 모든 권리 보유.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="mailto:vkflco8080@gmail.com" 
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Contact
                  </a>
                  <a 
                    href="https://github.com/vkflco08" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

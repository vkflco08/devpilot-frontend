"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface TaskFilterProps {
  onFilterChange: (filters: {
    tag: string
    priority: number
    search: string
  }) => void
  tags: string[]
}

const TaskFilter = ({ onFilterChange, tags }: TaskFilterProps) => {
  const [tag, setTag] = useState<string>("")
  const [priority, setPriority] = useState<number>(0)
  const [search, setSearch] = useState<string>("")

  // Use useCallback to memoize the filter function
  const applyFilters = useCallback(() => {
    onFilterChange({
      tag: tag === "all" ? "" : tag,
      priority: priority === 0 ? 0 : priority,
      search,
    })
  }, [tag, priority, search, onFilterChange])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">태스크 필터</h2>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="태스크 검색..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tag-filter">태그</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger id="tag-filter">
                <SelectValue placeholder="모든 태그" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 태그</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-filter">우선순위</Label>
            <Select value={priority.toString()} onValueChange={(value) => setPriority(Number.parseInt(value))}>
              <SelectTrigger id="priority-filter">
                <SelectValue placeholder="모든 우선순위" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">모든 우선순위</SelectItem>
                <SelectItem value="1">1 (최상)</SelectItem>
                <SelectItem value="2">2 (상)</SelectItem>
                <SelectItem value="3">3 (중)</SelectItem>
                <SelectItem value="4">4 (하)</SelectItem>
                <SelectItem value="5">5 (최하)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

export { TaskFilter }

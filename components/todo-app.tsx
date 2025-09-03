"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Tag, Filter, Search, Calendar, CheckCircle, Circle, Clock } from "lucide-react"
import { TaskItem } from "./task-item"
import { AddTaskDialog } from "./add-task-dialog"

export interface Task {
  id: string
  title: string
  completed: boolean
  color: string
  tags: string[]
  reminder?: Date
  subtasks: Task[]
  parentId?: string
}

interface FilterState {
  search: string
  tag: string
  status: "all" | "completed" | "pending" | "overdue"
  sortBy: "created" | "title" | "reminder"
}

export function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tag: "all",
    status: "all",
    sortBy: "created",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("todo-tasks")
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      // Convert reminder strings back to Date objects
      const tasksWithDates = parsedTasks.map((task: any) => ({
        ...task,
        reminder: task.reminder ? new Date(task.reminder) : undefined,
        subtasks:
          task.subtasks?.map((subtask: any) => ({
            ...subtask,
            reminder: subtask.reminder ? new Date(subtask.reminder) : undefined,
          })) || [],
      }))
      setTasks(tasksWithDates)
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("todo-tasks", JSON.stringify(tasks))
  }, [tasks])

  const addTask = (taskData: Omit<Task, "id" | "completed" | "subtasks">, parentId?: string) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      subtasks: [],
      parentId,
    }

    if (parentId) {
      // Add as subtask
      setTasks((prev) =>
        prev.map((task) => (task.id === parentId ? { ...task, subtasks: [...task.subtasks, newTask] } : task)),
      )
    } else {
      // Add as main task
      setTasks((prev) => [...prev, newTask])
    }
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updateTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, ...updates }
        }
        if (task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskRecursive(task.subtasks) }
        }
        return task
      })
    }
    setTasks((prev) => updateTaskRecursive(prev))
  }

  const deleteTask = (taskId: string) => {
    const deleteTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.filter((task) => {
        if (task.id === taskId) return false
        if (task.subtasks.length > 0) {
          task.subtasks = deleteTaskRecursive(task.subtasks)
        }
        return true
      })
    }
    setTasks((prev) => deleteTaskRecursive(prev))
  }

  const getAllTags = () => {
    const allTags = new Set<string>()
    const extractTags = (tasks: Task[]) => {
      tasks.forEach((task) => {
        task.tags.forEach((tag) => allTags.add(tag))
        extractTags(task.subtasks)
      })
    }
    extractTags(tasks)
    return Array.from(allTags)
  }

  const filteredTasks = tasks
    .filter((task) => {
      // Search filter
      if (
        filters.search &&
        !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.subtasks.some((subtask) => subtask.title.toLowerCase().includes(filters.search.toLowerCase()))
      ) {
        return false
      }

      // Tag filter
      if (
        filters.tag !== "all" &&
        !task.tags.includes(filters.tag) &&
        !task.subtasks.some((subtask) => subtask.tags.includes(filters.tag))
      ) {
        return false
      }

      // Status filter
      if (filters.status !== "all") {
        const isOverdue = task.reminder && task.reminder < new Date() && !task.completed
        const hasOverdueSubtasks = task.subtasks.some(
          (subtask) => subtask.reminder && subtask.reminder < new Date() && !subtask.completed,
        )

        switch (filters.status) {
          case "completed":
            if (!task.completed && !task.subtasks.some((subtask) => subtask.completed)) return false
            break
          case "pending":
            if (task.completed || isOverdue || hasOverdueSubtasks) return false
            break
          case "overdue":
            if (!isOverdue && !hasOverdueSubtasks) return false
            break
        }
      }

      return true
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "reminder":
          if (!a.reminder && !b.reminder) return 0
          if (!a.reminder) return 1
          if (!b.reminder) return -1
          return a.reminder.getTime() - b.reminder.getTime()
        case "created":
        default:
          return Number.parseInt(a.id) - Number.parseInt(b.id)
      }
    })

  const allTags = getAllTags()

  const clearFilters = () => {
    setFilters({
      search: "",
      tag: "all",
      status: "all",
      sortBy: "created",
    })
  }

  const hasActiveFilters =
    filters.search || filters.tag !== "all" || filters.status !== "all" || filters.sortBy !== "created"

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Todo App</h1>
        <p className="text-muted-foreground">Stay organized with hierarchical tasks, tags, and reminders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Tasks</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={hasActiveFilters ? "bg-primary/10 border-primary" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1">•</span>
                )}
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showFilters && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Tag filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tag</label>
                    <Select
                      value={filters.tag}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, tag: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tags</SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3" />
                              {tag}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value: any) => setFilters((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Circle className="w-3 h-3" />
                            All tasks
                          </div>
                        </SelectItem>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Circle className="w-3 h-3 text-blue-500" />
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="overdue">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-red-500" />
                            Overdue
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: any) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created">Date created</SelectItem>
                        <SelectItem value="title">Title (A-Z)</SelectItem>
                        <SelectItem value="reminder">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Reminder date
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!showFilters && allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.tag === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters((prev) => ({ ...prev, tag: "all" }))}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={filters.tag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, tag: prev.tag === tag ? "all" : tag }))}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          )}

          {/* Task list */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveFilters ? "No tasks match your current filters" : "No tasks yet. Add your first task!"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onAddSubtask={addTask}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddTaskDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddTask={addTask} />
    </div>
  )
}

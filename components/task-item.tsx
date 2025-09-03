"use client"

import { useState } from "react"
import type { Task } from "./todo-app"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { AddTaskDialog } from "./add-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onAddSubtask: (taskData: Omit<Task, "id" | "completed" | "subtasks">, parentId?: string) => void
  level?: number
}

const taskColors = [
  { name: "Default", value: "bg-card", border: "border-border" },
  { name: "Blue", value: "bg-blue-50", border: "border-blue-200" },
  { name: "Green", value: "bg-green-50", border: "border-green-200" },
  { name: "Yellow", value: "bg-yellow-50", border: "border-yellow-200" },
  { name: "Red", value: "bg-red-50", border: "border-red-200" },
  { name: "Purple", value: "bg-purple-50", border: "border-purple-200" },
]

export function TaskItem({ task, onUpdate, onDelete, onAddSubtask, level = 0 }: TaskItemProps) {
  const [expanded, setExpanded] = useState(true)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleToggleComplete = () => {
    onUpdate(task.id, { completed: !task.completed })
  }

  const handleColorChange = (color: string) => {
    onUpdate(task.id, { color })
  }

  const isOverdue = task.reminder && task.reminder < new Date() && !task.completed

  const currentColor = taskColors.find((c) => c.value === task.color) || taskColors[0]

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6")}>
      <Card
        className={cn(
          "transition-all duration-200",
          currentColor.value,
          currentColor.border,
          task.completed && "opacity-60",
          isOverdue && "ring-2 ring-destructive/50",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={task.completed} onCheckedChange={handleToggleComplete} className="mt-1" />

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium cursor-pointer hover:text-primary transition-colors",
                      task.completed && "line-through text-muted-foreground",
                    )}
                    onClick={() => setShowEditDialog(true)}
                  >
                    {task.title}
                  </h3>

                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {task.reminder && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs mt-2",
                        isOverdue ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <Calendar className="w-3 h-3" />
                      {task.reminder.toLocaleDateString()}{" "}
                      {task.reminder.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {isOverdue && <span className="font-medium">(Overdue)</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Color picker */}
                  <div className="flex gap-1">
                    {taskColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleColorChange(color.value)}
                        className={cn(
                          "w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform",
                          color.value,
                          color.border,
                          task.color === color.value && "ring-2 ring-primary ring-offset-1",
                        )}
                        title={`Change to ${color.name}`}
                      />
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => setShowAddSubtask(true)} className="h-8 w-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {task.subtasks.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-8 w-8 p-0">
                      {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subtasks */}
      {expanded && task.subtasks.length > 0 && (
        <div className="space-y-2">
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              level={level + 1}
            />
          ))}
        </div>
      )}

      <AddTaskDialog
        open={showAddSubtask}
        onOpenChange={setShowAddSubtask}
        onAddTask={(taskData) => onAddSubtask(taskData, task.id)}
        parentTask={task.title}
      />

      <EditTaskDialog open={showEditDialog} onOpenChange={setShowEditDialog} task={task} onUpdate={onUpdate} />
    </div>
  )
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: number;
  estimatedMinutes: number;
  potentialRevenue?: number;
}

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
  };

  const getTodaysTasks = () => {
    return tasks.filter(task => 
      task.dueDate && isToday(new Date(task.dueDate))
    );
  };

  const todaysTasks = getTodaysTasks();
  const totalTodayTime = todaysTasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const totalTodayRevenue = todaysTasks.reduce((total, task) => total + (task.potentialRevenue || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Calendar View
        </h2>
        <div className="text-lg font-semibold">
          {format(selectedDate, "MMMM yyyy")}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{todaysTasks.length}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{Math.round(totalTodayTime / 60)}h</div>
            <div className="text-sm text-gray-600">Estimated Time</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${totalTodayRevenue}</div>
            <div className="text-sm text-gray-600">Potential Revenue</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold p-2 bg-gray-100 rounded text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map(day => {
            const dayTasks = getTasksForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-20 p-2 border rounded cursor-pointer transition-colors ${
                  isCurrentDay 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                {dayTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1 mt-1 rounded truncate ${
                      task.priority >= 4 
                        ? 'bg-red-100 text-red-800' 
                        : task.priority >= 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Task Details */}
      {todaysTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Tasks</h3>
          <div className="space-y-3">
            {todaysTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(task.estimatedMinutes / 60)}h {task.estimatedMinutes % 60}m
                    </span>
                    {task.potentialRevenue && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${task.potentialRevenue}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority >= 4 
                    ? 'bg-red-100 text-red-800' 
                    : task.priority >= 3
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  Priority {task.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
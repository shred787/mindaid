import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, User, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  dueDate: string;
  estimatedRevenue?: number;
  clientId?: string;
  progress?: number;
}

interface Task {
  id: string;
  title: string;
  projectId?: string;
  status: string;
  dueDate: string;
  estimatedMinutes: number;
  priority: number;
}

export function TimelineView() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    if (projectTasks.length === 0) return project.progress || 0;
    
    const completedTasks = projectTasks.filter(task => task.status === "completed");
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const getProjectDuration = (project: Project) => {
    const start = parseISO(project.startDate);
    const end = parseISO(project.dueDate);
    return differenceInDays(end, start);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'on_hold': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const sortedProjects = [...projects].sort((a, b) => 
    parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );

  const upcomingTasks = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Timeline View
        </h2>
        <div className="text-sm text-gray-600">
          Project timelines and dependencies
        </div>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
          <div className="text-sm text-gray-600">Active Projects</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {projects.filter(p => p.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            ${projects.reduce((sum, p) => sum + (p.estimatedRevenue || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Project Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-6">Project Timeline</h3>
        <div className="space-y-6">
          {sortedProjects.map(project => {
            const progress = getProjectProgress(project);
            const duration = getProjectDuration(project);
            
            return (
              <div key={project.id} className="relative">
                <div className={`absolute left-0 top-0 w-3 h-3 rounded-full ${getStatusColor(project.status)} mt-1`}></div>
                <div className="ml-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">{project.title}</h4>
                      {getStatusIcon(project.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {duration} days
                      </span>
                      {project.estimatedRevenue && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${project.estimatedRevenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    {format(parseISO(project.startDate), "MMM d")} → {format(parseISO(project.dueDate), "MMM d, yyyy")}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(project.status)}`}
                          style={{width: `${progress}%`}}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                  </div>
                  
                  {project.id && (
                    <div className="mt-3 text-xs text-gray-500">
                      {tasks.filter(task => task.projectId === project.id).length} tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
        <div className="space-y-3">
          {upcomingTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-gray-600">
                  Due: {format(parseISO(task.dueDate), "MMM d, yyyy")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {Math.round(task.estimatedMinutes / 60)}h {task.estimatedMinutes % 60}m
                </span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority >= 4 
                    ? 'bg-red-100 text-red-800' 
                    : task.priority >= 3
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  P{task.priority}
                </div>
              </div>
            </div>
          ))}
          {upcomingTasks.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              No upcoming tasks scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
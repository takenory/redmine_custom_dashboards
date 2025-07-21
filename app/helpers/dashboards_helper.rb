module DashboardsHelper
  def render_issues_panel_content(panel)
    query_id = panel.config['query_id']
    columns = panel.config['columns']
    sort = panel.config['sort']
    
    if query_id
      query = IssueQuery.visible.find_by_id(query_id)
      if query
        query.column_names = columns if columns.present?
        query.sort_criteria = sort if sort.present?
        issues = query.issues(:limit => 10)
        
        {
          query: query,
          issues: issues,
          configured: true
        }
      else
        {
          queries: IssueQuery.visible.sorted,
          configured: false
        }
      end
    else
      {
        queries: IssueQuery.visible.sorted,
        configured: false
      }
    end
  end
end
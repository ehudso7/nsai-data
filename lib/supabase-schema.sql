-- NSAI Data Supabase Database Schema
-- This file contains the SQL schema for Supabase integration
-- with Row-Level Security (RLS) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Queue Jobs Table
CREATE TABLE IF NOT EXISTS queue_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    output_format TEXT DEFAULT 'text' CHECK (output_format IN ('text', 'json')),
    source_limit INTEGER DEFAULT 5 CHECK (source_limit >= 1 AND source_limit <= 10),
    focus_area TEXT DEFAULT 'general' CHECK (focus_area IN ('general', 'technology', 'business', 'healthcare', 'finance')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    attempts INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry TIMESTAMPTZ,
    error TEXT,
    result JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_user_id ON queue_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_created_at ON queue_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_next_retry ON queue_jobs(next_retry) WHERE next_retry IS NOT NULL;

-- Usage Analytics Table (supplement to main Prisma database)
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'POST',
    status_code INTEGER NOT NULL,
    duration_ms INTEGER,
    tokens_used INTEGER,
    credits_consumed INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_endpoint ON usage_analytics(endpoint);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_status_code ON usage_analytics(status_code);

-- Research History Table (user-specific view)
CREATE TABLE IF NOT EXISTS research_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    query_text TEXT NOT NULL,
    query_hash TEXT GENERATED ALWAYS AS (md5(query_text)) STORED,
    parameters JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result_summary TEXT,
    result_data JSONB,
    credits_used INTEGER DEFAULT 1,
    processing_time_ms INTEGER,
    error_details TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for research history
CREATE INDEX IF NOT EXISTS idx_research_history_user_id ON research_history(user_id);
CREATE INDEX IF NOT EXISTS idx_research_history_status ON research_history(status);
CREATE INDEX IF NOT EXISTS idx_research_history_created_at ON research_history(created_at);
CREATE INDEX IF NOT EXISTS idx_research_history_query_hash ON research_history(query_hash);
CREATE INDEX IF NOT EXISTS idx_research_history_tags ON research_history USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_research_history_favorites ON research_history(user_id) WHERE is_favorite = TRUE;

-- System Metrics Table (for admin dashboard)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type TEXT DEFAULT 'gauge' CHECK (metric_type IN ('gauge', 'counter', 'histogram')),
    dimensions JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_dimensions ON system_metrics USING GIN(dimensions);

-- Rate Limiting Table (supplement to Prisma)
CREATE TABLE IF NOT EXISTS rate_limits_supabase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- user_id:ip:endpoint
    endpoint TEXT NOT NULL,
    user_id TEXT,
    ip_address INET,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_duration_seconds INTEGER DEFAULT 3600,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits_supabase(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits_supabase(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits_supabase(user_id);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_queue_jobs_updated_at 
    BEFORE UPDATE ON queue_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_history_updated_at 
    BEFORE UPDATE ON research_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits_supabase ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queue_jobs
CREATE POLICY "Users can view own queue jobs" ON queue_jobs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own queue jobs" ON queue_jobs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own queue jobs" ON queue_jobs
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all queue jobs" ON queue_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for usage_analytics
CREATE POLICY "Users can view own analytics" ON usage_analytics
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all analytics" ON usage_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for research_history
CREATE POLICY "Users can view own research history" ON research_history
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own research history" ON research_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own research history" ON research_history
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all research history" ON research_history
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for system_metrics (admin only)
CREATE POLICY "Admin users can view system metrics" ON system_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
        )
    );

CREATE POLICY "Service role can manage system metrics" ON system_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for rate_limits_supabase
CREATE POLICY "Users can view own rate limits" ON rate_limits_supabase
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can manage all rate limits" ON rate_limits_supabase
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for analytics and metrics

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(target_user_id TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_requests BIGINT,
    total_credits BIGINT,
    avg_duration NUMERIC,
    error_count BIGINT,
    favorite_queries BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(credits_used), 0) as total_credits,
        COALESCE(AVG(processing_time_ms), 0) as avg_duration,
        COUNT(*) FILTER (WHERE status = 'failed') as error_count,
        COUNT(*) FILTER (WHERE is_favorite = TRUE) as favorite_queries
    FROM research_history 
    WHERE user_id = target_user_id 
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system-wide metrics
CREATE OR REPLACE FUNCTION get_system_metrics_summary(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    total_users BIGINT,
    total_requests BIGINT,
    avg_response_time NUMERIC,
    error_rate NUMERIC,
    queue_backlog BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_requests,
        COALESCE(AVG(duration_ms), 0) as avg_response_time,
        (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0) * 100) as error_rate,
        (SELECT COUNT(*) FROM queue_jobs WHERE status IN ('pending', 'processing')) as queue_backlog
    FROM usage_analytics 
    WHERE created_at >= NOW() - INTERVAL '1 hour' * hours_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old records
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old usage analytics (older than 90 days)
    DELETE FROM usage_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old rate limit records (older than 24 hours)
    DELETE FROM rate_limits_supabase 
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    -- Clean up completed/failed queue jobs (older than 7 days)
    DELETE FROM queue_jobs 
    WHERE status IN ('completed', 'failed', 'dead_letter') 
    AND updated_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old system metrics (older than 30 days)
    DELETE FROM system_metrics 
    WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled cleanup job (if pg_cron is available)
-- SELECT cron.schedule('cleanup-old-records', '0 2 * * *', 'SELECT cleanup_old_records();');

-- Views for easier querying

-- View for recent user activity
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT 
    user_id,
    COUNT(*) as request_count,
    MAX(created_at) as last_activity,
    SUM(credits_used) as total_credits,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_queries,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_queries
FROM research_history 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY request_count DESC;

-- View for queue health monitoring
CREATE OR REPLACE VIEW queue_health_status AS
SELECT 
    status,
    COUNT(*) as job_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age_seconds,
    MIN(created_at) as oldest_job,
    MAX(created_at) as newest_job
FROM queue_jobs 
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'pending' THEN 1 
        WHEN 'processing' THEN 2 
        WHEN 'completed' THEN 3 
        WHEN 'failed' THEN 4 
        WHEN 'dead_letter' THEN 5 
    END;

-- View for system performance metrics
CREATE OR REPLACE VIEW system_performance_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(duration_ms) as avg_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / COUNT(*) * 100) as error_rate_percent
FROM usage_analytics 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Create sample data for testing (optional)
-- INSERT INTO system_metrics (metric_name, metric_value, metric_type, dimensions) VALUES
-- ('api_requests_total', 1000, 'counter', '{"endpoint": "/api/research"}'),
-- ('response_time_avg', 1500, 'gauge', '{"endpoint": "/api/research"}'),
-- ('active_users', 42, 'gauge', '{}'),
-- ('queue_size', 5, 'gauge', '{"status": "pending"}');

COMMENT ON TABLE queue_jobs IS 'Job queue for AI research tasks with retry logic';
COMMENT ON TABLE usage_analytics IS 'Detailed API usage analytics and performance metrics';
COMMENT ON TABLE research_history IS 'User research query history with results';
COMMENT ON TABLE system_metrics IS 'System-wide performance and health metrics';
COMMENT ON TABLE rate_limits_supabase IS 'Rate limiting tracking for API endpoints';

COMMENT ON FUNCTION get_user_analytics_summary IS 'Get analytics summary for a specific user';
COMMENT ON FUNCTION get_system_metrics_summary IS 'Get system-wide metrics summary';
COMMENT ON FUNCTION cleanup_old_records IS 'Clean up old records to maintain database performance';
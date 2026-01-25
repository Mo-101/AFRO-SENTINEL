-- Enable realtime for signals table to support P1/P2 alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
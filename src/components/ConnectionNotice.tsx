interface ConnectionNoticeProps {
  connected: boolean;
}

export function ConnectionNotice({ connected }: ConnectionNoticeProps) {
  return connected ? null : (
    <p role="status" className="warning">
      Waiting for the API. Values may be stale; order entry is disabled until connected.
    </p>
  );
}

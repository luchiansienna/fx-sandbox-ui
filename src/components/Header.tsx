interface HeaderProps {
  connected: boolean;
}

export function Header({ connected }: HeaderProps) {
  return (
    <header>
      <a className="brand" href="/">
        FX<span>LAB</span>
        <small>TRADING SANDBOX</small>
      </a>
      <div className="connection">
        <i className={connected ? "on" : ""} />
        {connected ? "Simulation running" : "Connecting / offline"}
      </div>
      <span className="tag">PAPER ACCOUNT</span>
    </header>
  );
}

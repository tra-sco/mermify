export const PRESETS = {
  workflow: `flowchart TD
    Start([User Registration]) --> Input[Fill Details]
    Input --> Valid{Valid Input?}
    Valid -->|No| ShowError[Show Validation Error]
    ShowError --> Input
    Valid -->|Yes| CheckUser{User Exists?}
    CheckUser -->|Yes| Login[Prompt Login]
    CheckUser -->|No| Create[Create Account]
    Create --> Email[Send Verification Email]
    Email --> Success([Success])`,

  decision: `flowchart LR
    Start([Service Offline]) --> CheckPing{Ping Server?}
    CheckPing -->|Fail| Reboot[Reboot Server]
    CheckPing -->|Pass| CheckPort{Port 443 Open?}
    Reboot --> CheckPing
    CheckPort -->|No| StartService[Start Web Service]
    CheckPort -->|Yes| CheckDB{DB Reachable?}
    StartService --> CheckPort
    CheckDB -->|No| FixDB[Restore DB Connection]
    CheckDB -->|Yes| Online([Service Online])
    FixDB --> CheckDB`,

  devops: `flowchart TD
    User([User Client]) -->|HTTPS| DNS[Cloudflare DNS]
    DNS -->|Load Balance| ALB[Application Load Balancer]
    ALB -->|Route HTTP| WebApp[Web Application Server]
    WebApp -->|Read/Write| DB[(PostgreSQL Database)]
    DB -->|Replicate| DBReplica[(Read Replica)]
    WebApp -.->|Cache/Session| RedisServer((Redis Cache))`,
};

export type PresetKey = keyof typeof PRESETS;


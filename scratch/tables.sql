





-- Creating RallyDirectionsCache table
CREATE TABLE dbo.RallyDirectionsCache (
    StartLatitude DECIMAL(9,6) NOT NULL,
    StartLongitude DECIMAL(9,6) NOT NULL,
    EndLatitude DECIMAL(9,6) NOT NULL,
    EndLongitude DECIMAL(9,6) NOT NULL,
    ResponseJson NVARCHAR(MAX) NOT NULL, -- Stores the full JSON response
    CreatedAt DATETIME2 DEFAULT GETUTCDATE() NOT NULL, -- Timestamp for cache entry
    CONSTRAINT PK_RallyDirectionsCache PRIMARY KEY (
        StartLatitude,
        StartLongitude,
        EndLatitude,
        EndLongitude
    )
);

-- Optional: Add index for faster lookups (already covered by PK, but explicit for clarity)
CREATE NONCLUSTERED INDEX IX_RallyDirectionsCache_Coordinates
ON dbo.RallyDirectionsCache (StartLatitude, StartLongitude, EndLatitude, EndLongitude);



DROP TABLE [dbo].[RallyBonuses];

EXECUTE sp_rename N'[dbo].[tmp_ms_xx_RallyBonuses]', N'RallyBonuses';

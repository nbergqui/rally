SELECT TOP (1000) [BonusID]
      ,[BonusCode]
      ,[BonusName]
      ,[Points]
      ,[Latitude]
      ,[Longitude]
      ,[AvailableHours]
      ,[Description]
      ,[Leg]
      ,[Ordinal]
      ,[Include]
      ,[Visited]
      ,[LayoverMinutes]
  FROM [dbo].[RallyBonuses]
  WHERE [Leg] = 1
  ORDER BY [Ordinal];

  update RallyBonuses set Leg = 1
  where Leg = 4

  INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName], [StreetAddress], [City], [State], 
    [Latitude], [Longitude], [AvailableHours], [Description], [Requirements], 
    [Leg], [Ordinal], [Include], [Visited]
) VALUES (
    'REST1', 0, 'Rest 1', NULL, 'n/a', 'NA', 
    0, 0, NULL, NULL, NULL, 
    1, 41, 0, 0
);

INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName], [StreetAddress], [City], [State], 
    [Latitude], [Longitude], [AvailableHours], [Description], [Requirements], 
    [Leg], [Ordinal], [Include], [Visited]
) VALUES (
    'IAMH', 234, 'Matt''s House', NULL, 'Unknown', 'IA', 
    41.3985, -92.9026, NULL, NULL, NULL, 
    1, 41, 1, 0
);

select * from RallyLeg;

update RallyLeg set CheckpointTime = '2025-06-27 17:00:00'
where Leg = 3

update RallyLeg set StartTime = '2025-06-11 17:00:00.000'
where Leg = 1


select * from dbo.RallyDirectionsCache;

-- delete from dbo.RallyDirectionsCache


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
SELECT TOP (1000) [BonusID]
      ,[BonusCode]
      ,[Points]
      ,[BonusName]
      ,[StreetAddress]
      ,[City]
      ,[State]
      ,[Latitude]
      ,[Longitude]
      ,[AvailableHours]
      ,[Description]
      ,[Requirements]
      ,[Leg]
      ,[Ordinal]
      ,[Include]
      ,[Visited]
  FROM RallyBonuses
  WHERE [Leg] = 1
  ORDER BY [Ordinal]

  update RallyBonuses set Leg = 1
  where Leg = 4

  INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName], [StreetAddress], [City], [State], 
    [Latitude], [Longitude], [AvailableHours], [Description], [Requirements], 
    [Leg], [Ordinal], [Include], [Visited]
) VALUES (
    'IABW', 1234, 'Baymont by Wyndham Pella', NULL, 'Unknown', 'IA', 
    41.4145, -92.9428, NULL, NULL, NULL, 
    1, 1, 1, 0
);

INSERT INTO [dbo].[RallyBonuses] (
    [BonusCode], [Points], [BonusName], [StreetAddress], [City], [State], 
    [Latitude], [Longitude], [AvailableHours], [Description], [Requirements], 
    [Leg], [Ordinal], [Include], [Visited]
) VALUES (
    'IAMH', 234, 'Matt''s House', NULL, 'Unknown', 'IA', 
    41.3985, -92.9026, NULL, NULL, NULL, 
    1, 2, 1, 0
);

select * from RallyLeg

update RallyLeg set CheckpointTime = '2025-06-27 17:00:00'
where Leg = 3

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





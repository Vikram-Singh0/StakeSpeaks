# TalkStake Session Rating System

## Overview
The session rating system in TalkStake is designed to provide meaningful, multi-dimensional ratings that help users make informed decisions about which sessions to join.

## Rating Components

### 1. Session Average Rating (`averageRating`)
- **Source**: Direct participant feedback (1-5 stars)
- **Basis**: Post-session reviews from participants who attended the session
- **Weight**: 60% of overall speaker rating calculation
- **Range**: 1-5 stars

### 2. Speaker Rating (`speakerRating`)
- **Source**: Calculated from all speaker's completed sessions
- **Basis**: Weighted average combining:
  - Session ratings (60%)
  - Engagement score (20%)
  - Completion rate (20%)
- **Weight**: Higher weight given to sessions with more participants and reviews
- **Range**: 0-5 stars
- **Updates**: Recalculated whenever a new session is completed or reviewed

### 3. Engagement Score (`engagementScore`)
- **Source**: Calculated from session interaction metrics
- **Basis**: 
  - Likes ratio (40 points max): likes per participant
  - Comments ratio (30 points max): comments per participant
  - Viewer retention (30 points max): viewers retained vs max capacity
- **Range**: 0-100 points
- **Usage**: Converted to 5-star scale for speaker rating calculation

### 4. Completion Rate (`completionRate`)
- **Source**: Tracked when sessions end
- **Basis**: Percentage of participants who stayed until the end
- **Range**: 0-100%
- **Impact**: Higher completion rates indicate valuable content

### 5. Total Ratings (`totalRatings`)
- **Source**: Count of participant reviews
- **Usage**: Indicates reliability of the average rating
- **Impact**: More ratings = higher confidence in the score

## Rating Calculation Formula

### Speaker Rating Calculation:
```
For each completed session with reviews:
  sessionScore = (averageRating × 0.6) + 
                 ((engagementScore/100) × 5 × 0.2) + 
                 ((completionRate/100) × 5 × 0.2)
  
  weight = sqrt(totalRatings) × sqrt(participantCount)
  
speakerRating = sum(sessionScore × weight) / sum(weight)
```

### Engagement Score Calculation:
```
likesRatio = likes / participants
commentsRatio = comments / participants  
viewerRetention = viewers / maxParticipants

engagementScore = min(likesRatio, 1) × 40 +
                  min(commentsRatio, 0.5) × 2 × 30 +
                  min(viewerRetention, 1) × 30
```

## Rating Display Logic

### For New Sessions/Speakers:
- Display "New Speaker" or use fallback rating (4.5-5.0)
- No historical data available yet

### For Sessions with Reviews:
- Primary: Show `speakerRating` (overall speaker performance)
- Secondary: Show `averageRating` for this specific session
- Show `totalRatings` count for context

### For Completed Sessions:
- Show final `averageRating` from participant reviews
- Display `completionRate` and `engagementScore` metrics
- Show individual reviews with helpful votes

## Rating Updates

### When Session is Created:
- `averageRating`: 0 (no reviews yet)
- `speakerRating`: Calculated from speaker's previous sessions
- `engagementScore`: 0 (no interactions yet)
- `completionRate`: 0 (not completed)

### During Session:
- `viewers`: Updated in real-time
- `likes` and `comments`: Updated as participants interact

### When Session Ends:
- `completionRate`: Calculated from participant tracking
- `engagementScore`: Recalculated with final metrics
- `status`: Changed to 'completed'

### When Review is Added:
- `reviews`: New review added to array
- `averageRating`: Recalculated from all reviews
- `totalRatings`: Incremented
- `speakerRating`: Recalculated across all speaker sessions

## Benefits of This System

1. **Multi-dimensional**: Not just simple star ratings
2. **Weighted**: More reliable sessions have higher impact
3. **Dynamic**: Updates as more data becomes available
4. **Transparent**: Users can see different aspects of quality
5. **Fraud-resistant**: Combines multiple metrics that are hard to game
6. **Incentive-aligned**: Rewards speakers for quality content and engagement

## Future Enhancements

1. **Stake-based weighting**: Higher stakes could weight reviews more
2. **Time decay**: Older sessions could have less impact on current ratings
3. **Category-specific ratings**: Different standards for different topics
4. **Peer review**: Other speakers could rate session quality
5. **ROI correlation**: Link ratings to actual financial returns of participants
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const fetchFromLambda = () => {
  return axios
    .get('https://thantzin.ovh/dev/hello')
    .then((res) => res.data.msg);
};

export const LambdaPayload = () => {
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ['lambda'],
    queryFn: () => fetchFromLambda(),
  });

  if (isLoading) {
    return (
      <div>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '100px',
          }}
        >
          <CircularProgress />
        </Box>
      </div>
    );
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return <div> {data} </div>;
};

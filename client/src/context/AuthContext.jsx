import { createContext, useReducer, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null,
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload,
            };
        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false,
            };
        case 'REGISTER_SUCCESS':
            return {
                ...state,
                loading: false,
            };
        case 'REGISTER_FAIL':
        case 'AUTH_ERROR':
        case 'LOGIN_FAIL':
        case 'LOGOUT':
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = async () => {
        if (localStorage.getItem('token')) {
            // api interceptor already checks for token
        } else {
            dispatch({ type: 'AUTH_ERROR' });
            return;
        }

        try {
            const res = await api.get('/auth/me');

            dispatch({
                type: 'USER_LOADED',
                payload: res.data,
            });
        } catch (err) {
            dispatch({ type: 'AUTH_ERROR' });
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    // Register User
    const register = async (formData) => {
        try {
            const res = await api.post('/auth/register', formData);

            dispatch({
                type: 'REGISTER_SUCCESS',
                payload: res.data,
            });

            dispatch({
                type: 'REGISTER_SUCCESS',
                payload: res.data,
            });
        } catch (err) {
            dispatch({
                type: 'REGISTER_FAIL',
                payload: err.response.data.msg,
            });
            throw err;
        }
    };

    // Login User
    const login = async (formData) => {
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: res.data,
            });

            await loadUser();
        } catch (err) {
            dispatch({
                type: 'LOGIN_FAIL',
                payload: err.response.data.msg,
            });
            throw err;
        }
    };

    // Logout
    const logout = () => dispatch({ type: 'LOGOUT' });

    return (
        <AuthContext.Provider
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                register,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
